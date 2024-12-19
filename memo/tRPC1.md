
# 参考文献

- プロシージャは関数のような意味
- 参考記事
	- [アプリ開発をしながらtRPCとZodを学ぶ](https://zenn.dev/sutamac/articles/459c37e5e6de02)
		- やや応用
	- [【tRPC入門】初心者OK！型安全なプロジェクト開発のためのTRPC入門 - YouTube](https://www.youtube.com/watch?v=bwVjCPmhAN8)
		- 今回の参考元
# 手順
## バックエンド環境構築
### 起動準備

- `npm i express cors @trpc/server zod ` ：モジュール準備
- `npm i -D @types/cors @types/express @types/node nodemon ts-node typescript`：型・モジュール準備
- `npx tsc --init`：tsconfig生成
- package.jsonのscriptで`"dev": "nodemon --exec ts-node server.ts"`追加

## コード
```TypeScript
import express from "express";
import { initTRPC } from "@trpc/server";
import * as trpcExpresas from "@trpc/server/adapters/express";
import cors from "cors";
import z from "zod";

interface Todo {
  id: number;
  content: string;
}

const app = express();

app.use(cors());

const port = 5000;

const t = initTRPC.create(); //初期化
const router = t.router; //エンドポイントを作成
const publicProcedure = t.procedure; //publicProcedureを作成

const todoList: Todo[] = [
  { id: 1, content: "test1" },
  { id: 2, content: "test2" },
];

const appRouter = router({
  test: publicProcedure.query(() => {
    //queryはGETリクエストの役目を持つ関数のようなもの。エンドポイントではないため別途作成
    return "TEST TRPC";
  }),
  getTodo: publicProcedure.query(() => {
    return todoList;
  }),
  addTodo: publicProcedure.input(z.string()).mutation((req) => {
    const id = Math.random();
    const todo = { id, content: req.input };
    todoList.push(todo);
    return todoList;
  }),
  delTodo: publicProcedure.input(z.string()).mutation((req) => {
    const id = Math.random();
    const todo = { id, content: req.input };
    todoList.push(todo);
    return todoList;
  }),
});

//app.get("/", (req, res) => {
//  res.send("Hello World");
//});

app.use("/trpc", trpcExpresas.createExpressMiddleware({ router: appRouter })); //エンドポイントを設定

app.listen(port);

export type AppRouter = typeof appRouter; //クライアント側で型が使えるようにするためにexport

```

# フロント環境構築
## 環境
- `npm create vite@latest `：vite準備
- `npm install`：必要なモジュール自動ダウンロード
- `npm install @trpc/server @trpc/client @trpc/react-query @tanstack/react-query@latest`：公式サイトに書かれている準備

## trpcファイルの準備

/src/util/trpc.tsにコードを記載

```TypeScript
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/server";

export const trpc = createTRPCReact<AppRouter>();
```


## フロントコード

```TypeScript
// app.tsx
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "./util/trpc";
import { httpBatchLink } from "@trpc/client";
import TodoList from "./components/todoList";

function App() {
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: "http://localhost:5000/trpc" })], //バックエンドのURLを指定
      //必要ならヘッダーも設定可能
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <TodoList />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;

```

```TypeScript
// /componets/todoList.tsx
import { CSSProperties } from "react";
import { trpc } from "../util/trpc";
import { useState } from "react";

const styles: { [key: string]: CSSProperties } = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#cba471",
  },
  innerContainer: {
    width: "50%",
    height: "50%",
    padding: "20px",
    borderRadius: "15px",
    backgroundColor: "#ccd8e1",
    boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)",
  },
  title: {
    fontSize: "32px",
    color: "#333",
    marginBottom: "10px",
  },
  input: {
    width: "100%",
    padding: "12px 20px",
    margin: "8px 0",
    boxSizing: "border-box",
    borderRadius: "4px",
    border: "none",
    outline: "none",
  },
  list: {
    listStyleType: "none",
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between", // コンテンツを両端に寄せる
    alignItems: "center", // 垂直方向中央に配置
    backgroundColor: "#f9f9f9",
    margin: "8px 0",
    padding: "12px",
    borderRadius: "4px",
    textAlign: "left",
  },
  addButton: {
    padding: 10,
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  deleteButton: {
    marginLeft: "10px",
    cursor: "pointer",
    color: "red",
    textAlign: "right",
  },
};

const Test = () => {
  const [inputValue, setInputValue] = useState<string>("");
  const test = trpc.getTodo.useQuery();
  console.log(test.data);
  const allTodo = test.data;

  const addTodo = trpc.addTodo.useMutation({
    onSettled: () => {
      test.refetch(); //追加後に再取得
    },
  });

  return (
    <div style={styles.container}>
      <div style={styles.innerContainer}>
        <p style={styles.title}>Todo List</p>
        <input
          type="text"
          placeholder="What needs to be done?"
          style={styles.input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setInputValue(e.target.value)
          }
          value={inputValue}
        />
        <button
          style={styles.addButton}
          onClick={() => {
            addTodo.mutate(inputValue);
            setInputValue("");
          }}
        >
          Add Todo
        </button>
        <ul style={styles.list}>
          {allTodo?.map((todo) => (
            <li style={styles.listItem}>
              {todo.content}
              <span style={styles.deleteButton}>✖</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Test;

```