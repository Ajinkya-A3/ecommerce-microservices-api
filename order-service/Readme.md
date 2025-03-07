first start rabbitmq in docker container for this api to work
rabbit mq will work as message broker for order service

```
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:management
```

rabbit mq console can be accessed at 
```
http://localhost:15672
```

for consol initial username and password are guest guest