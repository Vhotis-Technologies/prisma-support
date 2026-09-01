"""
REST API for crew chat (support staff endpoints).

Support staff can:
- List all threads (filter by open/closed)
- Get thread detail with full message history
- Send messages (REST fallback, websocket is primary)
- Close/reopen threads

Crew chat bridge endpoints for detailer server:
- Get or create thread for a crew member
- Get thread for crew (by crew_user_id)
- Send message from crew
- Close thread from crew side
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from main.models.crew_chat import CrewChatThread, CrewChatMessage
from main.util.proxy_helpers import validate_internal_key
from main.util.crew_chat_notify import notify_crew_new_support_message

logger = logging.getLogger(__name__)


def broadcast_thread_message(thread_id, message):
    """Broadcast a chat message payload to the thread websocket group."""
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'crew_chat_{thread_id}',
        {
            'type': 'chat_message',
            'message': message,
        }
    )


def broadcast_thread_status(thread_id, status_value):
    """Broadcast open/closed status so all connected clients update immediately."""
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'crew_chat_{thread_id}',
        {
            'type': 'thread_status',
            'status': status_value,
            'thread_id': str(thread_id),
        }
    )


class SupportCrewChatView(APIView):
    """Support staff crew chat: list threads, get thread, send message, close."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, action, *args, **kwargs):
        if action == 'list_threads':
            return self._list_threads(request)
        elif action == 'get_thread':
            return self._get_thread(request)
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    
    def post(self, request, action, *args, **kwargs):
        if action == 'send_message':
            return self._send_message(request)
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, action, *args, **kwargs):
        if action == 'close_thread':
            return self._close_thread(request)
        elif action == 'reopen_thread':
            return self._reopen_thread(request)
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    
    def _list_threads(self, request):
        """List crew chat threads with filter."""
        status_filter = request.query_params.get('status', 'open')
        
        if status_filter == 'all':
            threads = CrewChatThread.objects.all()[:100]
        else:
            threads = CrewChatThread.objects.filter(status=status_filter)[:100]
        
        return Response({
            'data': {
                'threads': [{
                    'id': str(t.id),
                    'crew_name': t.crew_name,
                    'crew_email': t.crew_email,
                    'status': t.status,
                    'last_message_at': t.last_message_at.isoformat(),
                    'support_unread_count': t.support_unread_count,
                    'crew_unread_count': t.crew_unread_count,
                } for t in threads]
            }
        })
    
    def _get_thread(self, request):
        """Get thread detail with messages, mark as read for support."""
        thread_id = request.query_params.get('thread_id')
        if not thread_id:
            return Response({'error': 'thread_id required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            thread = CrewChatThread.objects.get(id=thread_id)
            messages = thread.messages.all()
            
            # Mark as read for support
            thread.support_unread_count = 0
            thread.save(update_fields=['support_unread_count'])
            
            return Response({
                'data': {
                    'thread': {
                        'id': str(thread.id),
                        'crew_name': thread.crew_name,
                        'crew_email': thread.crew_email,
                        'status': thread.status,
                        'last_message_at': thread.last_message_at.isoformat(),
                        'messages': [m.to_gifted_chat_format() for m in messages]
                    }
                }
            })
        except CrewChatThread.DoesNotExist:
            return Response({'error': 'Thread not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
    
    def _send_message(self, request):
        """Send message from support (REST fallback, websocket is primary)."""
        thread_id = request.data.get('thread_id')
        body = request.data.get('body', '').strip()
        
        if not thread_id or not body:
            return Response({'error': 'thread_id and body required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            thread = CrewChatThread.objects.get(id=thread_id)
            if thread.status == CrewChatThread.Status.CLOSED:
                return Response(
                    {'error': 'Thread is closed. Reopen chat to continue messaging.'},
                    status=status.HTTP_409_CONFLICT
                )
            
            # Create message
            message = CrewChatMessage.objects.create(
                thread=thread,
                sender_role='support',
                sender_id=str(request.user.id),
                sender_name=f"{request.user.first_name} {request.user.last_name}".strip() or "Support",
                body=body,
            )
            
            # Update thread
            thread.last_message_at = message.created_at
            thread.crew_unread_count += 1
            thread.save(update_fields=['last_message_at', 'crew_unread_count'])
            
            # Broadcast via Channels
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'crew_chat_{thread_id}',
                {
                    'type': 'chat_message',
                    'message': message.to_gifted_chat_format()
                }
            )

            notify_crew_new_support_message(
                crew_user_id=str(thread.crew_user_id),
                thread_id=str(thread.id),
                body=body,
                sender_name=message.sender_name,
            )
            
            return Response({
                'data': {
                    'message': message.to_gifted_chat_format()
                }
            })
        except CrewChatThread.DoesNotExist:
            return Response({'error': 'Thread not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Send message error: {e}")
            return Response({'error': str(e)}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _close_thread(self, request):
        """Close a chat thread."""
        thread_id = request.data.get('thread_id')
        if not thread_id:
            return Response({'error': 'thread_id required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            thread = CrewChatThread.objects.get(id=thread_id)
            thread.status = 'closed'
            thread.save(update_fields=['status'])
            system_message = CrewChatMessage.objects.create(
                thread=thread,
                sender_role='system',
                sender_id=request.user.id,
                sender_name='System',
                body='Chat closed by support staff.',
            )
            broadcast_thread_message(thread_id, system_message.to_gifted_chat_format())
            broadcast_thread_status(thread_id, thread.status)
            
            return Response({
                'data': {
                    'thread': {
                        'id': str(thread.id),
                        'status': thread.status
                    }
                }
            })
        except CrewChatThread.DoesNotExist:
            return Response({'error': 'Thread not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
    
    def _reopen_thread(self, request):
        """Reopen a closed thread."""
        thread_id = request.data.get('thread_id')
        if not thread_id:
            return Response({'error': 'thread_id required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            thread = CrewChatThread.objects.get(id=thread_id)
            thread.status = 'open'
            thread.save(update_fields=['status'])
            system_message = CrewChatMessage.objects.create(
                thread=thread,
                sender_role='system',
                sender_id=request.user.id,
                sender_name='System',
                body='Chat reopened by support staff.',
            )
            broadcast_thread_message(thread_id, system_message.to_gifted_chat_format())
            broadcast_thread_status(thread_id, thread.status)
            
            return Response({
                'data': {
                    'thread': {
                        'id': str(thread.id),
                        'status': thread.status
                    }
                }
            })
        except CrewChatThread.DoesNotExist:
            return Response({'error': 'Thread not found'}, 
                          status=status.HTTP_404_NOT_FOUND)

    def _broadcast_to_thread(self, thread_id, message):
        """Broadcast a message payload to the thread websocket group."""
        broadcast_thread_message(thread_id, message)

    def _broadcast_thread_status(self, thread_id, status_value):
        """Broadcast open/closed status to the thread websocket group."""
        broadcast_thread_status(thread_id, status_value)


class CrewChatBridgeView(APIView):
    """
    Bridge endpoints for detailer server (crew BFF).
    
    Validates internal API key, not crew JWT.
    Detailer server calls these endpoints on behalf of crew members.
    """
    
    permission_classes = []
    
    def dispatch(self, request, *args, **kwargs):
        """Validate internal API key before processing."""
        is_valid, error_response = validate_internal_key(request)
        if not is_valid:
            return error_response
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request, action, *args, **kwargs):
        if action == 'get_or_create_thread':
            return self._get_or_create_thread(request)
        elif action == 'send_message':
            return self._send_message(request)
        elif action == 'close_thread':
            return self._close_thread(request)
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request, action, *args, **kwargs):
        if action == 'get_thread_for_crew':
            return self._get_thread_for_crew(request)
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    
    def _get_or_create_thread(self, request):
        """Get or create thread for a crew member."""
        crew_user_id = request.data.get('crew_user_id')
        crew_name = request.data.get('crew_name')
        crew_email = request.data.get('crew_email')
        
        if not crew_user_id:
            return Response({'error': 'crew_user_id required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        thread, created = CrewChatThread.objects.get_or_create(
            crew_user_id=crew_user_id,
            defaults={
                'crew_name': crew_name or 'Crew Member',
                'crew_email': crew_email or '',
            }
        )
        
        return Response({
            'data': {
                'thread_id': str(thread.id),
                'created': created
            }
        })
    
    def _get_thread_for_crew(self, request):
        """Get thread + messages for a crew member, mark as read."""
        crew_user_id = request.query_params.get('crew_user_id')
        if not crew_user_id:
            return Response({'error': 'crew_user_id required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            thread = CrewChatThread.objects.get(crew_user_id=crew_user_id)
            messages = thread.messages.all()
            
            # Mark as read for crew
            thread.crew_unread_count = 0
            thread.save(update_fields=['crew_unread_count'])
            
            return Response({
                'data': {
                    'thread': {
                        'id': str(thread.id),
                        'status': thread.status,
                        'messages': [m.to_gifted_chat_format() for m in messages]
                    }
                }
            })
        except CrewChatThread.DoesNotExist:
            return Response({
                'data': {
                    'thread': None,
                    'messages': []
                }
            })
    
    def _send_message(self, request):
        """Send message from crew via detailer BFF."""
        thread_id = request.data.get('thread_id')
        body = request.data.get('body', '').strip()
        sender_id = request.data.get('sender_id')
        sender_name = request.data.get('sender_name', 'Crew Member')
        booking_reference = request.data.get('booking_reference')
        
        if not thread_id or not body or not sender_id:
            return Response({'error': 'thread_id, body, and sender_id required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            thread = CrewChatThread.objects.get(id=thread_id)
            if thread.status == CrewChatThread.Status.CLOSED:
                return Response(
                    {'error': 'Thread is closed. Reopen chat to continue messaging.'},
                    status=status.HTTP_409_CONFLICT
                )
            
            message = CrewChatMessage.objects.create(
                thread=thread,
                sender_role='crew',
                sender_id=sender_id,
                sender_name=sender_name,
                body=body,
                booking_reference=booking_reference,
            )
            
            # Update thread
            thread.last_message_at = message.created_at
            thread.support_unread_count += 1
            thread.save(update_fields=['last_message_at', 'support_unread_count'])
            
            # Broadcast via Channels (will work after Phase 3: websocket consumer)
            try:
                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'crew_chat_{thread_id}',
                    {
                        'type': 'chat_message',
                        'message': message.to_gifted_chat_format()
                    }
                )
            except Exception as broadcast_err:
                # Websockets not configured yet, message still saved to DB
                logger.warning(f"Could not broadcast message (websockets not configured): {broadcast_err}")
            
            return Response({
                'data': {
                    'message': message.to_gifted_chat_format()
                }
            })
        except CrewChatThread.DoesNotExist:
            return Response({'error': 'Thread not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Bridge send message error: {e}")
            return Response({'error': str(e)}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _close_thread(self, request):
        """Close thread from crew side."""
        crew_user_id = request.data.get('crew_user_id')
        if not crew_user_id:
            return Response({'error': 'crew_user_id required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            thread = CrewChatThread.objects.get(crew_user_id=crew_user_id)
            thread.status = 'closed'
            thread.save(update_fields=['status'])
            system_message = CrewChatMessage.objects.create(
                thread=thread,
                sender_role='system',
                sender_id=crew_user_id,
                sender_name='System',
                body='Chat closed by crew member.',
            )
            broadcast_thread_message(str(thread.id), system_message.to_gifted_chat_format())
            broadcast_thread_status(str(thread.id), thread.status)
            
            return Response({
                'data': {
                    'thread': {
                        'id': str(thread.id),
                        'status': thread.status
                    }
                }
            })
        except CrewChatThread.DoesNotExist:
            return Response({'error': 'Thread not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
