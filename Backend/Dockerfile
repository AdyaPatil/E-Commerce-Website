FROM python:3.9-slim as backend 

WORKDIR /app/backend

COPY requirements.txt /app/backend/requirements.txt

RUN pip install -r requirements.txt 

COPY . /app/backend  

EXPOSE 8000 

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]