@app
rsf-totaliser-5770

@aws
timeout 60
region eu-west-1
runtime nodejs
policies
  architect-default-policies

@http
/*
  method any
  src server

@static

@tables
user
  pk *String

password
  pk *String # userId
