from django.conf.urls import url
from django.urls import path
from . import views


urlpatterns = [
<<<<<<< HEAD
     url(r'^edittask$', views.edittask, name='edittask'),
     url(r'^schedule$', views.schedule, name='schedule'),
     url(r'^index$', views.index, name='index'),
     url(r'^welcome$', views.welcome, name='welcome'),
=======
     url(r'^edittask$', views.edittask),
     url(r'^schedule$', views.schedule),
     url(r'^index$', views.index),
     url(r'^welcome$', views.welcome),
>>>>>>> master
]

from django.contrib.staticfiles.urls import staticfiles_urlpatterns

# ... the rest of your URLconf here ...

urlpatterns += staticfiles_urlpatterns()
