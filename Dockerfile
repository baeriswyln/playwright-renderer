FROM node:20-bookworm

RUN npx -y playwright@1.49.1 install --with-deps

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node", "src/index.js"]
