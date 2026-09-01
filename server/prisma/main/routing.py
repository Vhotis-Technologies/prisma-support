"""WebSocket URL routing for Django Channels."""
from django.urls import re_path
from main.consumers import CrewChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/crew-chat/(?P<thread_id>[0-9a-f-]+)/$', CrewChatConsumer.as_asgi()),
]
