#!/bin/bash
#This script is for running tests in ci/cd

#pytest
#yarn cy:e2e
yarn cy:component
#cd backend
pytest