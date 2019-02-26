#!/bin/bash

ps -aux|grep random_place|awk '{print $2}'|xargs kill -9
