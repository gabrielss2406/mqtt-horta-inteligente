# ================= STAGE 1: Builder =================
# Instala todas as dependências (incluindo devDependencies) e copia o código
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Copia os arquivos de manifesto do pacote e instala as dependências
# Isso aproveita o cache do Docker se os arquivos package*.json não mudarem
COPY package*.json ./
RUN npm install

# Copia o resto do código-fonte
COPY . .


# ================= STAGE 2: Production =================
# Cria a imagem final, mais enxuta, apenas com o necessário para rodar
FROM node:20-slim

# Define o ambiente como produção, o que pode otimizar algumas libs
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copia os manifestos do pacote do estágio 'builder'
COPY --from=builder /usr/src/app/package*.json ./

# Instala APENAS as dependências de produção.
# O --omit=dev garante que as devDependencies não sejam instaladas
RUN npm install --omit=dev

# Copia o código-fonte da aplicação do estágio 'builder'
COPY --from=builder /usr/src/app/ .

# Expõe a porta que a aplicação vai usar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD [ "node", "server.js" ]