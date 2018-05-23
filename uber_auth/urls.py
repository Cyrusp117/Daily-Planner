
from django.conf.urls import url
from . import views


urlpatterns = [
     url(r'^uber$', views.login_uber, name='uber'),
     url(r'^uber/connect', views.connect, name='connect'),
     url(r'^uber/request', views.request_uber, name='request_uber')
     #url(r'^uber/request/(?P<picklat>\w+)/(?P<picklng>\w+)/(?P<destlat>\w+)/(?P<destlng>\w+)/', views.request_uber, name='request_uber')
]

