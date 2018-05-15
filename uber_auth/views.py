from django.shortcuts import render

from django.conf import settings
from django.contrib import auth
from django.contrib import sessions
from django.contrib.auth import authenticate
from django.http import HttpResponse
from django.http import QueryDict
from django.shortcuts import redirect
from django.utils import timezone

# Create your views here.

def login_uber(request):
    query = QueryDict(mutable=True)
    query.update({
        'client_id': settings.UBER_CLIENT_ID,
        'response_type': 'code',
        'scope': 'profile history ride_widgets',
        # TODO: Default redirect to /
        #'state': request.GET.get('next', '/accounts/hello')
    })
    return redirect(
        'https://login.uber.com/oauth/v2/authorize'
        + '?' + query.urlencode())