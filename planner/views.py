from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse
from django.shortcuts import render
from datetime import datetime
from google.oauth2 import id_token
from google.auth.transport import requests

def edittask(request):
    now = datetime.now()
    taskTitle = ''
    f_date = str(now.date())
    f_time = str(now.time())[:5]
    if request.method == 'POST':
        taskTitle = request.POST.get('taskTitle')
        destination = request.POST.get('destination')
        f_time = request.POST.get('f_time')
        f_date = request.POST.get('f_date')
        t_time = request.POST.get('t_time')
        t_date = request.POST.get('t_date')
    # TODO save all these to database, and also get initial value from database
    context = {
        'taskTitle': taskTitle,
        'f_date': f_date,
        'f_time': f_time
    }
    return render(request, 'edit_task.html', context)


def schedule(request):

    context = {}
    return render(request, 'schedule.html', context)

