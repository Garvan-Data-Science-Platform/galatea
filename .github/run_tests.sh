#!/bin/bash
#This script is for running tests in ci/cd
set -e
yarn dev --mode ci
yarn cy:e2e
yarn cy:component
pytest