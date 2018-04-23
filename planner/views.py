from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse
from django.shortcuts import render
 
def edittask(request):
    context          = {}
    context['taskTitle'] = 'title holder'
    return render(request, 'edit_task.html', context)