from django.conf.urls import url
from . import views


urlpatterns = [
     url(r'^uber$', views.login_uber, name='uber')
]

