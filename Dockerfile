FROM mcr.microsoft.com/playwright:v1.49.1-noble

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node", "src/index.js"]
