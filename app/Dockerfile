FROM node:18
RUN mkdir /opt/app
WORKDIR /opt/app
COPY app.js config.js metric_generator.js package.json package-lock.json ./
RUN npm install
ENTRYPOINT [ "node", "app.js" ]