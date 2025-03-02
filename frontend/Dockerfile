FROM node:18-alpine as frontend

WORKDIR /app/frontend

COPY package.json package-lock.json* /app/frontend

RUN npm install 

RUN npm i

COPY . /app/frontend

RUN npm run build

EXPOSE 3600

CMD ["npm", "start"] 