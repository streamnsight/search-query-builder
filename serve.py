#!/usr/bin/env python -u

import argparse
import redis
import flask

from gevent.pywsgi import WSGIServer
from flask import Flask, jsonify, render_template
from flask_cors import CORS, cross_origin

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
CORS(app)

REDIS_POOL = None

@app.route('/')
def home():
    return render_template('index.html')


@app.route('/schema/', methods=['GET'])
@cross_origin()
def schema():
    key = flask.request.args.get('key')
    r = []
    client = redis.Redis(connection_pool=REDIS_POOL)
    if key is not None:
        result = client.execute_command('FT.INFO', key)
        for t in result[5]:
            field = t[0].decode('ascii')
            field_info = {'name': field, 'type': t[2].decode('ascii')}
            if t[2] == b'TAG':
                options = client.execute_command('FT.TAGVALS', key, field)
                field_info.update({'options': [o.decode('ascii') for o in options]})
            r.append(field_info)
    return jsonify(r)


@app.route('/query/', methods=['POST'])
@cross_origin()
def query():
    data = flask.request.get_json()
    query_string = data['queryString']
    results = {}
    if len(query_string) > 0:
        client = redis.Redis(connection_pool=REDIS_POOL)
        result = client.execute_command(*query_string)
        results['records'] = result[0]
        results['docs'] = []
        for i in range(1, len(result), 2):
            id = result[i]
            doc_fields = result[i + 1]
            doc = {'id': id.decode('utf-8')}
            for k in range(0, len(doc_fields), 2):
                doc[doc_fields[k].decode('utf-8')] = doc_fields[k+1].decode('utf-8')
            results['docs'].append(doc)
        return jsonify(results)
    else:
        return '{}'

def main():
    global REDIS_POOL
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", help="server address to listen to", default="0.0.0.0")
    parser.add_argument("--port", help="port number to listen to", default=8080, type=int)
    parser.add_argument("--redis-server", help="redis server address", default="localhost")
    parser.add_argument("--redis-port", help="redis server port", default=6379, type=int)
    args = parser.parse_args()

    REDIS_POOL = redis.ConnectionPool(host=args.redis_server, port=args.redis_port)

    http_server = WSGIServer(('', args.port), app)
    http_server.serve_forever()


if __name__ == '__main__':
    main()
