from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BlockViewSet, index, layout_list


router = DefaultRouter()
router.register(r'blocks', BlockViewSet)



urlpatterns = [
    path('', index),                 
    path('api/', include(router.urls)),
    path('layouts/', layout_list),
]

