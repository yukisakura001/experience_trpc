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
