# Generated by Django 4.2.4 on 2023-10-23 06:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0004_alter_result_global_algorithm_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="result",
            name="channel",
            field=models.IntegerField(default=0),
        ),
    ]
