from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('graph/<str:team>/<str:channels>', views.xml, name='xml'),
    path('channels/<str:team>', views.channels, name='channels'),
    path('teams/', views.teams, name='teams'),
]
