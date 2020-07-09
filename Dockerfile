# node image
FROM buildkite/puppeteer:v1.15.0

# install all dependencies and speed tests
RUN apt-get update && apt-get install -y \
  cron \
  iperf \
  make \
  python-pip \
  speedtest-cli

RUN pip install --upgrade certifi && \
  apt-get remove -y make python-pip && \
  apt-get autoremove -y

RUN npm install -g npm && \
  npm --global config set user root && \
  npm --global install fast-cli

# add the measurement script
WORKDIR /usr/src/app

ADD package.json /usr/src/app

RUN npm install

COPY . /usr/src/app

# add the cron job
# COPY measure-cron /etc/cron.d/measure-cron
# RUN crontab /etc/cron.d/measure-cron

# CMD ["cron", "-f"]

CMD ["node", "index.js", "&&", "tail", "-f", "/dev/null"]