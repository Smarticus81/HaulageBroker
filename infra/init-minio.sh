#!/bin/bash
mc alias set local http://minio:9000 minioadmin minioadmin
mc mb local/carrier-docs --ignore-existing
mc anonymous set download local/carrier-docs
