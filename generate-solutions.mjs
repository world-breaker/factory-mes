import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, Math } from "docx";
import { writeFileSync } from "fs";
import { homedir } from "os";

const outDir = homedir() + "\\Downloads";
import { mkdirSync } from "fs";
try { mkdirSync(outDir, { recursive: true }); } catch {}

function h1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: t, bold: true, size: 36, font: "Times New Roman" })] }); }
function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 160 }, children: [new TextRun({ text: t, bold: true, size: 28, font: "Times New Roman" })] }); }
function h3(t) { return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 120 }, children: [new TextRun({ text: t, bold: true, size: 24, font: "Times New Roman" })] }); }
function p(t, opts = {}) { return new Paragraph({ spacing: { after: 120, before: 60 }, indent: opts.indent ? { left: 600 } : undefined, children: [new TextRun({ text: t, size: 21, font: "Times New Roman", italics: opts.italics, bold: opts.bold })] }); }
function eq(t) { return new Paragraph({ spacing: { after: 100, before: 80 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: t, size: 22, font: "Times New Roman", italics: true })] }); }

const doc = new Document({
  title: "Electromagnetism Solutions",
  creator: "Sisyphus",
  styles: {
    default: { document: { run: { font: "Times New Roman", size: 21 } } },
  },
  sections: [{
    properties: {},
    children: [
      h1("电磁场理论 习题解答"),
      p("", { indent: true }),

      h1("第一题 矩形波导"),

      h2("(1) 主模截止频率"),
      p("矩形波导尺寸：x方向宽度 a，y方向高度 b，a > b。填充真空（ε₀, μ₀）。"),
      p("TEₘₙ 模的截止波数："),
      eq("k_c = √[(mπ/a)² + (nπ/b)²]"),
      p("主模为 TE₁₀ 模（m=1, n=0），截止频率最低："),
      eq("f_c(TE₁₀) = c / (2a)"),
      p("对应的截止波长：λ_c = 2a。"),

      h2("(2) TEₘₙ 模场分量（设电场振幅为 E₀）"),
      p("TE 模满足 E_z = 0，H_z 满足波动方程。Hz 的通解为："),
      eq("H_z = H₀ cos(mπx/a) cos(nπy/b) e^(−jβz)"),
      p("由 Maxwell 方程组 ∇×E = −jωμH 和 ∇×H = jωεE 得到各分量："),
      p("电场分量："),
      eq("E_x = (jωμ/kc²)(nπ/b) H₀ cos(mπx/a) sin(nπy/b) e^(−jβz)"),
      eq("E_y = −(jωμ/kc²)(mπ/a) H₀ sin(mπx/a) cos(nπy/b) e^(−jβz)"),
      eq("E_z = 0"),
      p("磁场分量："),
      eq("H_x = −(jβ/kc²)(mπ/a) H₀ sin(mπx/a) cos(nπy/b) e^(−jβz)"),
      eq("H_y = −(jβ/kc²)(nπ/b) H₀ cos(mπx/a) sin(nπy/b) e^(−jβz)"),
      eq("H_z = H₀ cos(mπx/a) cos(nπy/b) e^(−jβz)"),
      p("其中："),
      eq("kc² = (mπ/a)² + (nπ/b)²,  β = √(k²−kc²),  k = ω√(μ₀ε₀)"),
      p("设电场振幅为 E₀，由 E_y 的最大值得："),
      eq("E₀ = (ωμ/kc²)(mπ/a) H₀"),
      eq("H₀ = E₀ kc² a / (ωμmπ)   (m ≠ 0)"),
      p("对于 TE₁₀ 主模（m=1, n=0），化简得："),
      eq("E_y = E₀ sin(πx/a) e^(−jβz)"),
      eq("H_x = −(β/ωμ) E₀ sin(πx/a) e^(−jβz)"),
      eq("H_z = j(π/ωμa) E₀ cos(πx/a) e^(−jβz)"),

      h1("第二题 振荡电偶极子辐射"),

      h2("(1) 辐射场近似下的电磁场"),
      p("电偶极矩沿 z 方向：p = p₀ e^(−iωt) ẑ，位于原点。"),
      p("在辐射区（kr ≫ 1，远场近似），保留 1/r 项："),
      p("电场（球坐标 θ 分量）："),
      eq("E_θ = −(ω²p₀ sinθ / 4πε₀c²r) e^(i(kr−ωt))"),
      p("磁场（球坐标 φ 分量）："),
      eq("B_φ = −(μ₀ω²p₀ sinθ / 4πcr) e^(i(kr−ωt))"),
      p("或 H_φ = −(ω²p₀ sinθ / 4πcr) e^(i(kr−ωt))"),
      p("辐射场特点："),
      p("  ① 横电磁波（TEM），E、H、r 相互垂直", { indent: true }),
      p("  ② 振幅 ∝ sinθ，在赤道面（θ=π/2）最大，沿轴向（θ=0,π）为零", { indent: true }),
      p("  ③ E ∝ ω²，高频辐射更强", { indent: true }),

      h2("(2) 辐射功率与距离无关的证明"),
      p("辐射区的玻印亭矢量平均值为："),
      eq("⟨S_r⟩ = ½ Re(E_θ H_φ*) = ω⁴p₀² sin²θ / (32π²ε₀c³r²)"),
      p("通过半径为 R 的球面的总辐射功率："),
      eq("P = ∮⟨S⟩·dA = ∫₀²π ∫₀^π ⟨S_r⟩ R² sinθ dθ dφ"),
      eq("  = [ω⁴p₀²/(32π²ε₀c³)]·2π·∫₀^π sin³θ dθ"),
      eq("  = [ω⁴p₀²/(16πε₀c³)]·(4/3)"),
      eq("  = ω⁴p₀² / (12πε₀c³)"),
      p("结果中不含 R，因此辐射功率与球面半径 R 无关。物理意义：电磁波携带能量传播到无穷远，能量守恒。"),

      h1("第三题 导体表面的反射相移"),

      p("平面偏振电磁波从折射率为 n 的介质正入射到导体表面，导体的复折射率："),
      eq("n̂_c = n(1 + ip)"),
      p("正入射的反射系数："),
      eq("r = (n₁ − n₂) / (n₁ + n₂)"),
      p("其中 n₁ = n（入射介质），n₂ = n̂_c = n(1+ip)（导体）："),
      eq("r = (n − n(1+ip)) / (n + n(1+ip))"),
      eq("  = (−ip) / (2 + ip)"),
      eq("  = −(p² + 2ip) / (p² + 4)"),
      p("反射系数的模："),
      eq("|r| = p / √(p² + 4)"),
      p("反射系数的辐角——即反射光电场相对入射光电场的相移："),
      eq("φ = arg(r) = −π + arctan(2/p)"),
      p("讨论极限情况："),
      p("  • 理想导体 p → ∞：φ → −π + arctan(0) = −π，r → −1（全反射，相位反转）", { indent: true }),
      p("  • 不良导体 p ≪ 1：φ ≈ −π + π/2 = −π/2", { indent: true }),
      p("物理上，−π 和 π 等同（mod 2π），理想导体反射时电场反相。"),

      h1("第四题 导电磁介质的涡旋电流"),

      h2("基本方程与趋肤深度"),
      p("空间 z > 0 充满介质（磁导率 μ，电导率 σ），位移电流忽略。"),
      p("外加缓变磁场 B = B₀ cos(ωt) ŷ，沿 y 方向。"),
      p("由 Maxwell 方程组推导磁扩散方程："),
      eq("∇²B = μσ ∂B/∂t"),
      p("设 B = B(z) e^(iωt)（复数形式），代入得："),
      eq("d²B/dz² = iωμσ B"),
      p("解为衰减波形式，引入趋肤深度 δ："),
      eq("δ = √(2 / ωμσ)"),
      p("解得磁场分布："),
      eq("B_y(z,t) = B₀ e^(−z/δ) cos(ωt − z/δ)"),

      h2("涡旋电流分布"),
      p("由 Ampère 定律 J = ∇×H = (1/μ)∇×B："),
      eq("J_x = −(1/μ) ∂B_y/∂z"),
      eq("    = (B₀√2 / μδ) e^(−z/δ) cos(ωt − z/δ + π/4)"),
      p("完整表述："),
      p("  ① 电流密度幅值沿深度指数衰减：J ∝ e^(−z/δ)", { indent: true }),
      p("  ② 电流相位随深度线性滞后：Δφ = −z/δ（波向介质内部传播）", { indent: true }),
      p("  ③ 在表面处（z=0），电流领先外磁场 π/4", { indent: true }),

      h2("结论"),
      p("涡旋电流集中在趋肤深度 δ = √(2/ωμσ) 内，频率越高、电导率越大、磁导率越大，趋肤深度越小（趋肤效应越显著）。表面电流与外磁场相位差为 π/4。"),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
const filePath = outDir + "\\电磁场习题解答.docx";
writeFileSync(filePath, buffer);
console.log("Done! Saved to: " + filePath);
