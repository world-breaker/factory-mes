import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import { writeFileSync } from "fs";

// Helper to create a heading paragraph
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, font: "微软雅黑" })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, size: 26, font: "微软雅黑" })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, size: 22, font: "微软雅黑" })],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 100, before: 60 },
    indent: opts.indent ? { left: 400 } : undefined,
    children: [new TextRun({ text, size: 21, font: "微软雅黑", ...opts })],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 60 },
    bullet: { level: 0 },
    children: [new TextRun({ text, size: 21, font: "微软雅黑" })],
  });
}

function bullet2(text) {
  return new Paragraph({
    spacing: { after: 60 },
    bullet: { level: 1 },
    children: [new TextRun({ text, size: 21, font: "微软雅黑" })],
  });
}

function tip(text) {
  return new Paragraph({
    spacing: { after: 100, before: 80 },
    indent: { left: 200 },
    children: [
      new TextRun({ text: "💡 提示：", bold: true, size: 20, font: "微软雅黑", color: "2563EB" }),
      new TextRun({ text, size: 20, font: "微软雅黑", color: "2563EB" }),
    ],
  });
}

const doc = new Document({
  title: "工厂MES使用说明",
  description: "Factory MES User Manual",
  styles: {
    default: {
      document: {
        run: { font: "微软雅黑", size: 21 },
      },
    },
  },
  sections: [
    {
      properties: {},
      children: [
        h1("工厂MES 使用说明"),
        para("适用于：车间操作工、班组长、管理员"),
        para("版本：v1.0"),

        h1("一、登录"),
        para("在电脑或手机浏览器中打开系统网址，输入用户名和密码后点击登录。"),
        bullet("管理员账号：admin / admin123"),
        bullet("操作工账号：zhang3 / 123456"),
        tip("如忘记密码，请联系管理员重置。"),

        h1("二、首页（生产看板）"),
        para("登录后进入首页，可以看到："),
        bullet("顶部统计：工单总数、生产中、待处理、今日完成数量"),
        bullet("趋势图：过去7天产量变化（折线图）"),
        bullet("仪表盘：整体完成率和合格率"),
        bullet("快捷按钮：新建工单、去报工、入库、检验"),

        h1("三、工单管理"),
        h2("查看工单"),
        para("左侧导航点「工单管理」，所有工单以卡片形式展示。"),
        bullet("卡片上显示：工单编号、产品名称、计划数量、完成进度"),
        bullet("颜色标记：绿色=已完成，蓝色=生产中，橙色=待处理，红色=紧急"),
        h2("新建工单"),
        para("点击右上角「新建工单」按钮："),
        bullet("选产品、填计划数量、选产线、选工艺模板"),
        bullet("可设优先级（普通/高/紧急）和截止日期"),
        bullet("提交后工单自动出现在列表中"),
        h2("工单详情"),
        para("点击工单卡片进入详情页，可查看："),
        bullet("工序进度：当前进行到哪一步"),
        bullet("质量记录：该工单的质检记录"),
        bullet("报工记录：各工序的报工情况"),

        h1("四、车间报工"),
        para("这是操作工最常用的功能。"),
        h2("开始生产"),
        bullet("在车间报工页面，找到待处理的工单"),
        bullet("点击工单进入详情"),
        bullet("点击「开始工序」按钮开始生产"),
        h2("报工"),
        bullet("工序开始后，填写：良品数量、不良品数量"),
        bullet("点击「提交报工」完成该工序"),
        h2("完成工单"),
        bullet("所有工序完成后，工单自动标记为「已完成」"),
        tip("报工数据用于统计产量和合格率，请如实填写。"),

        h1("五、库存管理"),
        h2("查看库存"),
        para("点击左侧「库存管理」，默认显示所有物料的库存数量。"),
        bullet("库存不足的物料会显示红色警告"),
        h2("入库"),
        bullet("点击「入库」按钮 → 选物料 → 填数量 → 填库位 → 提交"),
        h2("出库"),
        bullet("点击「出库」按钮 → 选物料 → 填数量 → 可关联工单 → 提交"),
        h2("新建物料"),
        bullet("点击「新建物料」→ 填写名称、编码、规格、单位、最低库存预警 → 提交"),

        h1("六、质量管理"),
        h2("检验操作"),
        bullet("在质量管理页面，点击工单旁的「检验」按钮"),
        bullet("选择检验结果：合格 / 不合格"),
        bullet("如不合格，填写缺陷类型和缺陷数量"),
        bullet("提交后记录保存"),
        h2("查看记录"),
        bullet("点「检验记录」查看所有历史记录"),
        bullet("点「质量报表」查看统计汇总"),
        tip("检验数据自动关联到对应工单，可追溯。"),

        h1("七、系统管理（仅管理员）"),
        para("管理员账号专有功能。"),
        h2("用户管理"),
        bullet("查看所有用户：用户名、姓名、角色、状态"),
        bullet("添加用户：点击「添加用户」→ 填写信息 → 提交"),
        h2("产品管理"),
        bullet("查看所有产品及其工单数量"),
        bullet("添加产品：点击「添加产品」→ 填写信息 → 提交"),
        h2("工艺模板"),
        bullet("查看各产品的工艺流程和工序步骤"),

        h1("八、常见问题"),
        h3("手机打不开系统？"),
        bullet("用手机 Chrome 或 Safari 浏览器打开，不要用微信内置浏览器"),
        bullet("首次加载可能等 5-10 秒（数据库冷启动）"),
        bullet("如果用移动数据打不开，换 Wi-Fi 试试"),
        bullet("还有问题？给我发报错截图"),

        h3("忘记密码？"),
        para("联系管理员在系统管理页面重置密码。"),

        h3("页面加载慢？"),
        para("免费版数据库空闲时会休眠，首次访问需要 5-10 秒唤醒，之后就快了。"),

        h3("报工报错了怎么办？"),
        para("目前不支持修改已提交的报工记录，请联系管理员处理。"),

        h1("九、账号角色说明"),
        para("系统有三种角色，权限不同："),
        bullet("管理员（admin）：全部功能可用，包括系统管理"),
        bullet("班组长（supervisor）：可看所有工单和质量数据"),
        bullet("操作工（operator）：只能看自己产线的工单，主要用报工功能"),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync("D:\\programmer\\factory-mes\\工厂MES使用说明.docx", buffer);
console.log("Done! 工厂MES使用说明.docx created");
