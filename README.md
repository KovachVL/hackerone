# hackerone

# Start

.env.example is located in pt_crm/. You can use it for testing my project. The site itself runs on port 3000, and S3 on port 9001

```bash

cd pt_crm

docker compose up --build -d 
```

If you want to embed the model, here's what you need to do. After Docker is up and running, run the following command in the directory:

```bash
docker exec -it pt_crm-ollama-1 ollama pull phi3
```
