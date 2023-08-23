#!/bin/bash
#This script is for running tests in ci/cd
set -e
#pytest
#yarn cy:e2e
yarn cy:component
#cd backend
pytest