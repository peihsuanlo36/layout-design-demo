from django.contrib import admin
from .models import Block
@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ("id", "layout_name", "x", "y", "width", "height", "updated_at")
    list_filter = ("layout_name",)
    ordering = ("-updated_at",)