FROM python:3.12-alpine
WORKDIR /app
COPY . /app/site
ENV PORT=80
EXPOSE 80
VOLUME ["/app/site/server/data"]
CMD ["python", "/app/site/server/app.py"]
