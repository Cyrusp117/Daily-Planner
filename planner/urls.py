from django.conf.urls import url
from django.urls import path
from . import views


urlpatterns = [
     url(r'^edittask$', views.edittask),
     url(r'^schedule$', views.schedule)
]
