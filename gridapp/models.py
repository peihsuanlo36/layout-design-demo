from django.db import models
from simple_history.models import HistoricalRecords

class Block(models.Model):
    x = models.FloatField()
    y = models.FloatField()
    width = models.FloatField()
    height = models.FloatField()
    layout_name = models.CharField(max_length=100, default="default")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f"Block #{self.id} ({self.layout_name})"
