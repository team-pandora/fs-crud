#!/bin/bash

MONGODB1='mongo1:27017'
MONGODB2='mongo2:27017'
MONGODB3='mongo3:27017' 

sleep 10

mongo --host "${MONGODB1}" <<EOF
  const cfg = {
    "_id": "rs0",
    "version": 1,
    "members": [
      {
        "_id": 0,
        "host": "${MONGODB1}",
        "priority": 2
      },
      {
        "_id": 1,
        "host": "${MONGODB2}",
        "priority": 0
      },
      {
        "_id": 2,
        "host": "${MONGODB3}",
        "priority": 0
      }
    ]
  };
  rs.initiate(cfg);
  rs.reconfig(cfg, { force: true });
EOF
