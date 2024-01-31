#!/bin/bash
#This script is for running tests in ci/cd
set -e
yarn cy:e2e
yarn cy:component
pytest