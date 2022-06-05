FROM alpine:latest
WORKDIR /root
COPY ./NyarukoDownloadCenter ./NyarukoDownloadCenter
COPY ./setting.json ./setting.json
COPY ./code.csv ./code.csv
RUN chmod +x ./NyarukoDownloadCenter
ENTRYPOINT ["./NyarukoDownloadCenter"]
