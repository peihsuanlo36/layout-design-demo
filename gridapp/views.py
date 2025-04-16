from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.utils.encoding import force_str
from django.utils.timezone import now
from django.contrib.contenttypes.models import ContentType
from django.contrib.admin.models import LogEntry, CHANGE
from django.http import JsonResponse

from .models import Block
from .serializers import BlockSerializer


class BlockViewSet(viewsets.ModelViewSet):
    queryset = Block.objects.all()
    serializer_class = BlockSerializer


    def get_queryset(self):
        layout_name = self.request.query_params.get('layout_name', None)
        if layout_name:
            return Block.objects.filter(layout_name=layout_name)
        return Block.objects.all()


    def get_object(self):
        return get_object_or_404(Block, pk=self.kwargs["pk"])


    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        data = request.data

        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        change_type = []
        if 'x' in data or 'y' in data:
            change_type.append("position")
        if 'width' in data or 'height' in data:
            change_type.append("size")


        if request.user.is_authenticated and change_type:
            LogEntry.objects.log_action(
                user_id=request.user.id,
                content_type_id=ContentType.objects.get_for_model(instance).pk,
                object_id=instance.pk,
                object_repr=force_str(instance),
                action_flag=CHANGE,
                change_message=f"{' and '.join(change_type)} update via frontend"
            )

        return Response(serializer.data)


def index(request):
    return render(request, 'index.html', {"timestamp": now().timestamp()})


def layout_list(request):
    layout_names = Block.objects.values_list('layout_name', flat=True).distinct()
    return JsonResponse(list(layout_names), safe=False)
