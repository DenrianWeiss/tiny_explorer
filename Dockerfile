FROM ubuntu:latest

RUN apt update && apt install -y curl git && curl -L https://foundry.paradigm.xyz | bash && ~/.foundry/bin/foundryup
ENV PATH="/root/.foundry/bin:${PATH}"

COPY explorer /usr/local/bin/explorer
RUN chmod +x /usr/local/bin/explorer

ENTRYPOINT ["/usr/local/bin/explorer"]