# Proof of Concept: Redisearch query builder widget

This PoC runs with the demo data from the Redis University RU201 (Redisearch) course.

## Setup


### Data

Run the docker container with redisearch and the data:

```bash
docker run -d -p 6379:6379 redisuniversity/ru201-lab
```

The data consists of an index `permits` of building permits.


### code

install the requirements

```bash
pip install -r requirements.txt
```

run the server:

```bash
./serve.py
```

by defaults it runs on port 8080

Open the browser to

[http://localhost:8080/](http://localhost:8080/)

