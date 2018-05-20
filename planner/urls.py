from django.conf.urls import url
from django.urls import path
from . import views


urlpatterns = [
     url(r'^edittask$', views.edittask),
     url(r'^schedule$', views.schedule),
     url(r'^index$', views.index),
     url(r'^draft_restaurant$', views.draft_restaurant),
     url(r'^$', views.login),
]

from django.contrib.staticfiles.urls import staticfiles_urlpatterns

# ... the rest of your URLconf here ...

urlpatterns += staticfiles_urlpatterns()
