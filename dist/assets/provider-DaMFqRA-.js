var h=Object.defineProperty;var d=(e,t,n)=>t in e?h(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var l=(e,t,n)=>d(e,typeof t!="symbol"?t+"":t,n);class r extends Error{constructor(n,s,o){super(s);l(this,"kind");l(this,"status");this.name="AIError",this.kind=n,this.status=o}}function w(e){let t=e.trim().replace(/\/+$/,"");return/\/chat\/completions$/.test(t)?t:/\/v1$/.test(t)?`${t}/chat/completions`:/\/v1/.test(t)?`${t}/chat/completions`:`${t}/v1/chat/completions`}function f(e,t,n){return new Promise((s,o)=>{const i=new AbortController,a=setTimeout(()=>{i.abort(),o(new r("timeout",`请求超时（${n}ms）`))},n);fetch(e,{...t,signal:i.signal}).then(c=>{clearTimeout(a),s(c)}).catch(c=>{clearTimeout(a),c.name==="AbortError"?o(new r("timeout",`请求超时（${n}ms）`)):o(new r("network",`网络请求失败：${c.message}`))})})}async function y(e){var t;if(e.status===401||e.status===403)throw new r("auth","鉴权失败：API Key 无效或无权限。",e.status);if(e.status===429)throw new r("rate_limit","请求过于频繁，已被限流，请稍后重试。",e.status);if(!e.ok){let n="";try{const s=await e.json();n=((t=s==null?void 0:s.error)==null?void 0:t.message)??(s==null?void 0:s.message)??""}catch{}throw new r("unknown",`服务返回错误 ${e.status}${n?"："+n:""}`,e.status)}try{return await e.json()}catch{throw new r("parse","响应不是合法的 JSON。",e.status)}}function u(e){var n,s;const t=(n=e.choices)==null?void 0:n[0];return((s=t==null?void 0:t.message)==null?void 0:s.content)??""}function m(e){let t=e.trim();const n=t.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);return n&&(t=n[1].trim()),t.startsWith("```")&&(t=t.replace(/^```(?:json)?\s*\n?/,"").trim()),t}class p{constructor(t){l(this,"config");l(this,"chatUrl");this.config=t,this.chatUrl=w(t.endpoint)}isAvailable(){return!!this.config.apiKey&&!!this.config.endpoint&&!!this.config.model}async chat(t){const n=this.config.timeout??3e4,s=this.config.maxRetries??2;let o;for(let i=0;i<=s;i++)try{const a=await f(this.chatUrl,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.config.apiKey}`},body:JSON.stringify(t)},n);return await y(a)}catch(a){if(o=a,a instanceof r&&(a.kind==="auth"||a.kind==="parse"||a.kind==="invalid"))throw a;if(a instanceof r&&a.kind==="rate_limit"){await new Promise(c=>setTimeout(c,1e3*(i+1)));continue}await new Promise(c=>setTimeout(c,400*(i+1)))}throw o instanceof Error?o:new r("unknown","请求失败且重试耗尽。")}async generateScene(t){const n=[{role:"system",content:'你是互动叙事编剧。根据用户提示生成一个场景节点，返回 JSON：{"title":"场景标题","text":"场景正文","speaker":"说话人(可选)"}。text 应有氛围感和细节，80-200 字。'},{role:"user",content:t.prompt+(t.context?`
上下文：${t.context}`:"")}],s=await this.chat({model:this.config.model,messages:n,temperature:.8,response_format:{type:"json_object"}}),o=u(s);try{return JSON.parse(m(o))}catch{throw new r("parse","生成场景的返回无法解析为 JSON。")}}async generateBranch(t){const s=[{role:"system",content:`你是互动叙事编剧。为给定场景生成 ${t.count??3} 个可选行动分支，返回 JSON：{"choices":[{"label":"简短选项","description":"可选说明"}]}。label 控制在 12 字内。`},{role:"user",content:`场景：${t.sceneText}`}],o=await this.chat({model:this.config.model,messages:s,temperature:.85,response_format:{type:"json_object"}}),i=u(o);try{return JSON.parse(m(i))}catch{throw new r("parse","生成分支的返回无法解析为 JSON。")}}async generateStory(t){const n=t.endingCount??3,s=[{role:"system",content:g(n)},{role:"user",content:t.prompt}],o=await this.chat({model:this.config.model,messages:s,temperature:.85,max_tokens:4096,response_format:{type:"json_object"}}),i=u(o);return{story:JSON.parse(m(i)),source:"ai",raw:i}}async review(t){const n=[{role:"system",content:'你是剧情评审专家。对给定剧情给出评分(0-10)和改进建议，返回 JSON：{"score":7,"suggestions":["建议1","建议2"]}。'},{role:"user",content:t.content}],s=await this.chat({model:this.config.model,messages:n,temperature:.6,response_format:{type:"json_object"}}),o=u(s);try{return JSON.parse(m(o))}catch{throw new r("parse","评审返回无法解析为 JSON。")}}}function g(e){return`你是一位资深互动叙事编剧，擅长设计悬疑、解谜、分支选择与多结局的互动故事。

根据用户的一句话描述，生成一个完整的互动故事，返回严格的 JSON，结构如下：

{
  "title": "故事标题",
  "description": "一句话简介",
  "tags": ["题材1", "题材2"],
  "startNodeId": "n1",
  "nodes": [
    {
      "id": "n1",
      "type": "start",
      "title": "场景标题",
      "text": "场景正文，要有氛围感和细节，80-200字",
      "speaker": "旁白或角色名(可选)"
    },
    {
      "id": "n2",
      "type": "scene",
      "title": "...",
      "text": "...",
      "speaker": "..."
    },
    {
      "id": "n3",
      "type": "clue",
      "title": "线索标题",
      "text": "发现线索的描述",
      "clueKey": "线索英文标识如rusty_key",
      "clueName": "线索中文名如生锈的钥匙"
    },
    {
      "id": "n4",
      "type": "puzzle",
      "title": "谜题标题",
      "text": "谜题场景描述",
      "puzzleAnswer": "正确答案如4242",
      "puzzlePrompt": "输入提示如请输入密码",
      "puzzleHint": "错误提示"
    },
    {
      "id": "n5",
      "type": "ending",
      "title": "结局标题",
      "text": "结局正文",
      "endingKind": "good"
    }
  ],
  "choices": [
    { "from": "n1", "to": "n2", "label": "选项文字" }
  ],
  "items": [
    { "key": "rusty_key", "name": "生锈的钥匙" }
  ]
}

要求：
1. type 只能是 start / scene / clue / puzzle / ending 之一。
2. 必须有且仅有一个 start 节点，startNodeId 指向它。
3. 至少 ${e} 个 ending 节点，endingKind 为 good / neutral / bad / secret 之一。
4. 节点 id 用 n1, n2, n3... 顺序命名，必须唯一。
5. choices 的 from 和 to 必须引用已存在的节点 id。
6. 从 start 出发必须能到达所有结局，不要有孤立的节点。
7. 谜题节点应配合线索节点：先有线索给出密码，再有谜题要求输入。
8. 选项 label 简短（12字内），有行动感。
9. 剧情要有逻辑、悬念和转折，不要空节点或重复套话。
10. 只返回 JSON，不要任何额外文字或解释。`}function N(e){return!e.enabled||!e.apiKey||!e.endpoint||!e.model?null:new p(e)}function S(e){return!!e.apiKey&&!!e.endpoint&&!!e.model}async function x(e){if(!S(e))return{ok:!1,message:"请填写 Endpoint、模型名称和 API Key。"};const t=new p(e),n=Date.now();try{return await t.chat({model:e.model,messages:[{role:"user",content:"ping"}],max_tokens:1}),{ok:!0,message:`连接成功，模型 ${e.model} 可用。`,latency:Date.now()-n}}catch(s){return{ok:!1,message:s instanceof r?s.message:s.message||"未知错误"}}}export{r as A,N as c,x as t};
