"""
WebSocket consumer for crew ↔ support chat (support-side connections).

Support staff connect here with their JWT to receive real-time messages from crew.
Each thread has its own channel group (crew_chat_{thread_id}).
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)


class CrewChatConsumer(AsyncWebsocketConsumer):
    """
    Support staff websocket for crew chat.
    
    URL: /ws/crew-chat/<thread_id>/?token=<support_jwt>
    
    Support staff connects to a specific thread to receive real-time messages.
    Messages are broadcast to all connected clients (support + crew on detailer WS).
    """
    
    async def connect(self):
        self.thread_id = self.scope['url_route']['kwargs']['thread_id']
        self.room_group_name = f'crew_chat_{self.thread_id}'
        self.user = None
        self.user_name = None
        
        # Extract JWT from query string
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('token=', 1)[1]
                break
        
        if not token:
            logger.warning("WS connection rejected: missing token")
            await self.close(code=4003)
            return
        
        # Verify JWT and get support staff user
        try:
            # Lazy import to avoid AppRegistryNotReady error
            from rest_framework_simplejwt.tokens import AccessToken
            
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            self.user = await self.get_support_staff_user(user_id)
            
            if not self.user:
                logger.warning(f"WS connection rejected: user {user_id} not found or not support staff")
                await self.close(code=4004)
                return
            
            self.user_name = f"{self.user.first_name} {self.user.last_name}".strip() or "Support"
            
        except Exception as e:
            logger.warning(f"WS auth failed: {e}")
            await self.close(code=4003)
            return
        
        # Verify thread exists
        thread_exists = await self.check_thread_exists(self.thread_id)
        if not thread_exists:
            logger.warning(f"WS connection rejected: thread {self.thread_id} not found")
            await self.close(code=4004)
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"Support staff {self.user.email} joined thread {self.thread_id}")
    
    async def disconnect(self, close_code):
        """Leave room group on disconnect."""
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            if hasattr(self, 'user') and self.user:
                logger.info(f"Support staff {self.user.email} left thread {self.thread_id}")
    
    async def receive(self, text_data):
        """Handle incoming messages from support staff."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'message')
            
            if message_type == 'message':
                body = data.get('body', '').strip()
                if not body:
                    return
                
                # Save message to database
                message, error_code = await self.save_message(
                    thread_id=self.thread_id,
                    body=body,
                    sender_role='support',
                    sender_id=str(self.user.id),
                    sender_name=self.user_name
                )
                
                if error_code == 'thread_closed':
                    await self.send(text_data=json.dumps({
                        'type': 'thread_status',
                        'status': 'closed',
                        'thread_id': self.thread_id,
                    }))
                    return

                if not message:
                    logger.error(f"Failed to save message for thread {self.thread_id}")
                    return
                
                # Broadcast to room (all support staff on this thread + crew)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message
                    }
                )
        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON received from {self.user.email}")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def chat_message(self, event):
        """
        Receive message from room group and send to WebSocket.
        
        Called when a message is broadcast to the room group.
        """
        message = event['message']
        await self.send(text_data=json.dumps(message))

    async def thread_status(self, event):
        """Forward thread open/closed status to connected support clients."""
        await self.send(text_data=json.dumps({
            'type': 'thread_status',
            'status': event['status'],
            'thread_id': event.get('thread_id'),
        }))
    
    @database_sync_to_async
    def get_support_staff_user(self, user_id):
        """Get support user by JWT user_id, ensuring they are support staff."""
        try:
            from main.models.user import SupportStaff
            support_staff = SupportStaff.objects.select_related("user").get(user_id=user_id)
            return support_staff.user
        except ObjectDoesNotExist:
            return None
    
    @database_sync_to_async
    def check_thread_exists(self, thread_id):
        """Check if thread exists."""
        try:
            from main.models.crew_chat import CrewChatThread
            return CrewChatThread.objects.filter(id=thread_id).exists()
        except Exception:
            return False
    
    @database_sync_to_async
    def save_message(self, thread_id, body, sender_role, sender_id, sender_name):
        """Save message to database and return gifted-chat format."""
        try:
            from main.models.crew_chat import CrewChatThread, CrewChatMessage
            
            thread = CrewChatThread.objects.get(id=thread_id)
            if thread.status == CrewChatThread.Status.CLOSED:
                return None, 'thread_closed'
            
            message = CrewChatMessage.objects.create(
                thread=thread,
                sender_role=sender_role,
                sender_id=sender_id,
                sender_name=sender_name,
                body=body,
            )
            
            # Update thread
            thread.last_message_at = message.created_at
            
            # Increment unread count for the other side
            if sender_role == 'support':
                thread.crew_unread_count += 1
            else:
                thread.support_unread_count += 1
            
            thread.save(update_fields=['last_message_at', 'crew_unread_count', 'support_unread_count'])

            if sender_role == 'support':
                from main.util.crew_chat_notify import notify_crew_new_support_message
                notify_crew_new_support_message(
                    crew_user_id=str(thread.crew_user_id),
                    thread_id=str(thread.id),
                    body=body,
                    sender_name=sender_name,
                )
            
            return message.to_gifted_chat_format(), None
            
        except Exception as e:
            logger.error(f"Error saving message: {e}")
            return None, 'failed'
