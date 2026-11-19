
"use strict";

// ========================================
// 1. 탭 전환
// ========================================

function openTab(evt, tabId) {
  document.querySelectorAll(".tab-content").forEach(tab => {
    tab.classList.remove("active");
  });

  document.querySelectorAll(".tab-btn").forEach(button => {
    button.classList.remove("active");
  });

  document.getElementById(tabId).classList.add("active");
  evt.currentTarget.classList.add("active");
}

// ========================================
// 2. 큰 숫자 클래스
// 숫자를 mantissa × 10^exponent 형태로 저장
// ========================================

/**
* 지수적 단위 쌉가능
*/
class Big_Num {
  /**
  * @param {number} mantissa - 숫자의 가수
  * @param {number} exponent - 숫자의 지수
  */
  constructor(mantissa, exponent) {
    this.mantissa = mantissa;
    this.exponent = exponent;
    this.normalize();
  }

  normalize() {
    if (this.mantissa === 0) {
      this.exponent = 0;
      return this;
    }

    const e = Math.floor(Math.log10(Math.abs(this.mantissa)));

    this.mantissa /= 10 ** e;
    this.exponent += e;

    const decimal = this.exponent - Math.floor(this.exponent);

    this.mantissa *= 10 ** decimal;
    this.exponent = Math.floor(this.exponent);

    return this;
  }

  copy() {
    return new Big_Num(this.mantissa, this.exponent);
  }

  add(other) {
    if (!(other instanceof Big_Num)) {
      other = new Big_Num(other, 0);
    }

    const result = this.copy();
    const dif = other.exponent - this.exponent;

    if (dif > 0) {
      result.exponent = other.exponent;

      if (dif < 15) {
        result.mantissa =
          this.mantissa * 10 ** -dif + other.mantissa;
      } else {
        result.mantissa = other.mantissa;
      }
    } else {
      if (-dif < 15) {
        result.mantissa += other.mantissa * 10 ** dif;
      }
    }

    return result.normalize();
  }

  sub(other) {
    if (!(other instanceof Big_Num)) {
      other = new Big_Num(other, 0);
    }

    const result = this.copy();
    const dif = other.exponent - result.exponent;

    if (dif > 0) {
      if (dif < 15) {
        result.mantissa =
          result.mantissa - other.mantissa * 10 ** dif;
      } else {
        result.mantissa = -other.mantissa;
        result.exponent = other.exponent;
      }
    } else if (-dif < 15) {
      result.mantissa -= other.mantissa * 10 ** dif;
    }

    return result.normalize();
  }

  mul(other) {
    if (!(other instanceof Big_Num)) {
      other = new Big_Num(other, 0);
    }

    return new Big_Num(
      this.mantissa * other.mantissa,
      this.exponent + other.exponent
    );
  }

  div(other) {
    if (!(other instanceof Big_Num)) {
      other = new Big_Num(other, 0);
    }

    return new Big_Num(
      this.mantissa / other.mantissa,
      this.exponent - other.exponent
    );
  }

  format() {
    const unit = [
      "", "K", "M", "B", "T",
      "Qa", "Qt", "Sx", "Sp", "Oc", "No"
    ];

    const value = this.copy();

    if (value.mantissa === 0) return "0.00";

    if (value.exponent < 0) {
      if (value.exponent < -324) return "0.00";
      return (
        value.mantissa * 10 ** value.exponent
      ).toFixed(2);
    }

    if (value.exponent < 33) {
      const index = Math.floor(value.exponent / 3);
      const number = value.mantissa *
        10 ** (value.exponent % 3);

      if (index < unit.length) {
        return `${number.toFixed(
          Math.max(0, 2 - value.exponent % 3)
        )}${unit[index]}`;
      }
    }

    const valueSuper = Math.log10(value.exponent);

    if (valueSuper < 15) {
      return `${value.mantissa.toFixed(2)}e${value.exponent.toLocaleString()}`;
    }

    return '"Big Num"';
  }

  compare(other) {
    if (!(other instanceof Big_Num)) {
      other = new Big_Num(other, 0);
    }

    if (this.mantissa === 0 && other.mantissa === 0) return 0;
    if (this.mantissa === 0) return other.mantissa > 0 ? -1 : 1;
    if (other.mantissa === 0) return this.mantissa > 0 ? 1 : -1;

    const aNegative = this.mantissa < 0;
    const bNegative = other.mantissa < 0;

    if (aNegative !== bNegative) {
      return aNegative ? -1 : 1;
    }

    let result;

    if (this.exponent !== other.exponent) {
      result = this.exponent > other.exponent ? 1 : -1;
    } else {
      result = this.mantissa > other.mantissa
        ? 1
        : this.mantissa < other.mantissa ? -1 : 0;
    }

    return aNegative ? -result : result;
  }

  gt(other) {
    return this.compare(other) > 0;
  }

  gte(other) {
    return this.compare(other) >= 0;
  }

  lt(other) {
    return this.compare(other) < 0;
  }

  lte(other) {
    return this.compare(other) <= 0;
  }

  eq(other) {
    return this.compare(other) === 0;
  }

  neq(other) {
    return this.compare(other) !== 0;
  }

  random() {
    return this.copy().mul(Math.random());
  }

  root() {
    return new Big_Num(
      this.mantissa ** 0.5,
      this.exponent / 2
    );
  }

  floor() {
    if (this.mantissa === 0) return new Big_Num(0, 0);

    if (this.exponent < 0) {
      return new Big_Num(this.mantissa < 0 ? -1 : 0, 0);
    }

    if (this.exponent >= 15) return this.copy();

    return new Big_Num(
      Math.floor(this.mantissa * 10 ** this.exponent),
      0
    );
  }

  toNumber() {
    if (this.exponent > 308 || this.exponent < -324) {
      throw new Error("Big_Num이 Number 범위를 벗어났습니다!");
    }

    return this.mantissa * 10 ** this.exponent;
  }

  fraction() {
    return this.copy().sub(this.copy().floor());
  }

  toSafeNumber() {
    if (this.exponent > 15 || this.exponent < -15) {
      throw new Error(
        "pow 지수가 현재 Big_Num exponent 시스템 범위를 초과했습니다."
      );
    }

    return this.mantissa * 10 ** this.exponent;
  }

  log10() {
    if (this.mantissa <= 0) {
      throw new Error("0 이하의 값에는 log10을 사용할 수 없습니다!");
    }

    return new Big_Num(
      Math.log10(this.mantissa) + this.exponent,
      0
    );
  }

  pow(other) {
    if (!(other instanceof Big_Num)) {
      other = new Big_Num(other, 0);
    }

    if (this.mantissa <= 0) {
      throw new Error("0 이하의 수에는 pow를 사용할 수 없습니다.");
    }

    const log = this.copy().log10().mul(other);
    const exponent = log.copy().floor();
    const decimal = log.copy().fraction();

    return new Big_Num(
      10 ** decimal.toSafeNumber(),
      exponent.toSafeNumber()
    );
  }
}

// ========================================
// 3. 화폐 클래스
// ========================================

class Null_Currency {
  constructor(count) {
    this.count = count instanceof Big_Num
      ? count
      : new Big_Num(count, 0);
  }
}

class Base_Currency extends Null_Currency {
  constructor(count) {
    super(count);
    this.base_count = this.count.copy();
  }

  reset() {
    this.count = this.base_count.copy();
  }
}

class Prestige_Null_Currency extends Base_Currency {
  constructor(count, reset_list) {
    super(count);

    this.reset_list = Array.isArray(reset_list)
      ? reset_list
      : [reset_list];
  }

  reset_to_get() {
    this.to_income();

    for (const value of this.reset_list) {
      value.reset();
    }

    playSound("prestige")
  }

  to_income() {}
}

class Prestige_Return_Currency extends Prestige_Null_Currency {
  constructor(count, reset_list, under_currency, multi, under_if) {
    super(count, reset_list);
    this.under_currency = under_currency;
    this.multi = multi;
    this.under_if = under_if;
  }

  reset_to_get() {
    if (this.under_currency.count.gte(this.under_if)) {
      this.to_income();

      for (const value of this.reset_list) {
        value.reset();
      }

      playSound("prestige")
    }
  }

  to_income() {
    const get = this.under_currency.count.copy();
    this.count = this.count.copy().add(
      this.income_calculate(get)
    );
  }

  income_calculate(out) {
    return out.mul(this.multi.count);
  }
}

class Prestige_Formula_Currency extends Prestige_Return_Currency {
  constructor(
    count, reset_list, under_currency, multi,
    under_if, gain_base, gain_divisor, gain_offset
  ) {
    super(count, reset_list, under_currency, multi, under_if);

    this.gain_base = gain_base;
    this.gain_divisor = gain_divisor;
    this.gain_offset = gain_offset;
  }

  income_calculate(out) {
    return this.gain_base.copy()
      .pow(
        out.copy().log10()
          .div(this.gain_divisor.copy())
          .sub(this.gain_offset.copy())
      )
      .mul(this.multi.count.copy().div(33).add(1));
  }

  Earn_display() {
    const language = document.getElementById("language-button");
    if (this.under_currency.count.neq(0)) {
      try {
        if (this.under_currency.count.gte(this.under_if)) {
          return this.income_calculate(
            this.under_currency.count
          ).format();
        }
        else {
          if (language.textContent.trim() == "한국어") {
            return "잠겨있습니다"
          }
          else {
            return "locked"
          }
        }
      } catch (error) {
        if (language.textContent.trim() == "한국어") {
          return "잠겨있습니다"
        }
        else {
          return "locked"
        }
      }
    }

    if (language.textContent.trim() == "한국어") {
      return "잠겨있습니다"
    }
    else {
      return "locked"
    }
  }
}

// ========================================
// 4. 룬 시스템
// ========================================

class Null_Rune extends Base_Currency {
  constructor(count, name, chance) {
    super(count);
    this.name = name;
    this.chance = chance;
  }

  gain(amount = 1) {
    this.count = this.count.copy().add(amount);
  }
}

class Null_Runes {
  constructor(runes, cost) {
    this.runes = Array.isArray(runes) ? runes : [runes];
    this.cost = cost instanceof Big_Num
      ? cost
      : new Big_Num(cost, 0);
  }

  roll() {
    if (this.runes.length === 0) return null;

    const totalChance = this.runes.reduce(
      (sum, rune) => sum + rune.chance, 0
    );

    if (
      !Number.isFinite(totalChance) ||
      totalChance <= 0 ||
      this.runes.some(
        rune => !Number.isFinite(rune.chance) || rune.chance < 0
      )
    ) {
      throw new Error("룬의 획득 확률을 확인해 주세요.");
    }

    let random = Math.random() * totalChance;

    for (const rune of this.runes) {
      random -= rune.chance;

      if (random < 0) {
        playSound("gacha");
        rune.gain();
        return rune;
      }
    }

    const rune = this.runes[this.runes.length - 1];
    rune.gain();
    return rune;
  }
}

// ========================================
// 5. 업그레이드 클래스
// ========================================

class Null_Upgrade {
  constructor(currency, cost) {
    this.currency = currency;
    this.cost = cost instanceof Big_Num
      ? cost
      : new Big_Num(cost, 0);
  }

  buy() {
    if (!this.currency.count.gte(this.cost)) return false;

    this.currency.count = this.currency.count.copy().sub(this.cost);
    this.effect();
    return true;
  }

  effect() {}
}

class Increase_Upgrade extends Null_Upgrade {
  constructor(currency, cost, cost_mul) {
    super(currency, cost);

    this.base_cost = this.cost.copy();
    this.cost_mul = cost_mul instanceof Big_Num
      ? cost_mul
      : new Big_Num(cost_mul, 0);
  }

  effect() {
    this.cost = this.cost.copy().mul(this.cost_mul);
    playSound("purchase")
  }

  reset() {
    this.cost = this.base_cost.copy();
  }
}

class Earn_Upgrade extends Increase_Upgrade {
  constructor(currency, cost, cost_mul, stat, stat_get) {
    super(currency, cost, cost_mul);

    this.stat = stat;
    this.stat_get = stat_get instanceof Big_Num
      ? stat_get
      : new Big_Num(stat_get, 0);
  }

  effect() {
    super.effect();
    this.stat.count = this.stat.count.copy().add(this.stat_get);
  }
}

class Multiply_Upgrade extends Increase_Upgrade {
  constructor(currency, cost, cost_mul, stat, stat_mul) {
    super(currency, cost, cost_mul);

    this.stat = stat;
    this.stat_mul = stat_mul instanceof Big_Num
      ? stat_mul
      : new Big_Num(stat_mul, 0);
  }

  effect() {
    super.effect();
    this.stat.count = this.stat.count.copy().mul(this.stat_mul);
  }
}

// ========================================
// 6. 게임 클래스
// ========================================

class Game {
  constructor() {
    this.common_rune = new Null_Rune(0, "common", 1000);
    this.uncommom_rune = new Null_Rune(0, "uncommon", 400);
    this.rare_rune = new Null_Rune(0, "rare", 200);
    this.epic_rune = new Null_Rune(0, "epic", 50);
    this.legendary_rune = new Null_Rune(0, "legendary", 15);

    this.grade_rune_pack = new Null_Runes(
      [
        this.common_rune,
        this.uncommom_rune,
        this.rare_rune,
        this.epic_rune,
        this.legendary_rune
      ],
      new Big_Num(1, 2)
    );

    this.funds = new Base_Currency(0);

    this.multi = new Prestige_Formula_Currency(
      0, [this.funds], this.funds, this.common_rune, new Big_Num(1, 1),
      new Big_Num(1, 1), new Big_Num(1.5, 0), new Big_Num(1, 0)
    );

    this.rebirth = new Prestige_Formula_Currency(
      0, [this.funds, this.multi], this.multi, this.uncommom_rune, new Big_Num(2, 2),
      new Big_Num(1, 1), new Big_Num(2.25, 0), new Big_Num(1.3, 0)
    );

    this.ultra = new Prestige_Formula_Currency(
      0, [this.funds, this.multi, this.rebirth],
      this.rebirth, this.rare_rune, new Big_Num(5, 2),
      new Big_Num(1, 1), new Big_Num(2.25, 0), new Big_Num(1.3, 0)
    );

    this.prestige = new Prestige_Formula_Currency(
      0, [this.funds, this.multi, this.rebirth, this.ultra],
      this.ultra, this.epic_rune, new Big_Num(2.25, 3),
      new Big_Num(1, 1), new Big_Num(2.25, 0), new Big_Num(1.3, 0)
    );

    this.mega = new Prestige_Formula_Currency(
      0, [this.funds, this.multi, this.rebirth, this.ultra, this.prestige],
      this.prestige, this.legendary_rune, new Big_Num(7, 3),
      new Big_Num(1, 1), new Big_Num(2.25, 0), new Big_Num(1.3, 0)
    );

    this.score = new Base_Currency(0);

    this.upgrades = {
      
    }
  }

  text_UI() {
    document.getElementById("score_text").innerText =
      this.score.count.format();

    document.getElementById("fund_text").innerText =
      this.funds.count.format();

    document.getElementById("multi-text").innerText =
      this.multi.count.format();

    document.getElementById("multi-gain-text").innerText =
      this.multi.Earn_display();

    document.getElementById("rebirth-text").innerText =
      this.rebirth.count.format();

    document.getElementById("rebirth-gain-text").innerText =
      this.rebirth.Earn_display();

    document.getElementById("ultra-text").innerText =
      this.ultra.count.format();

    document.getElementById("ultra-gain-text").innerText =
      this.ultra.Earn_display();

    document.getElementById("prestige-text").innerText =
      this.prestige.count.format();

    document.getElementById("prestige-gain-text").innerText =
      this.prestige.Earn_display();

    document.getElementById("mega-text").innerText =
      this.mega.count.format();

    document.getElementById("mega-gain-text").innerText =
      this.mega.Earn_display();
  }
}

const game = new Game();


const sounds = {
    gacha: new Audio("gacha.wav"),
    prestige: new Audio("prestige.wav"),
    purchase: new Audio("purchase.wav")
};

// 기본 음량
let master_volume = 0.5;

// 효과음 재생
function playSound(name) {
  const sound = sounds[name];

  if (!sound) {
    console.warn("존재하지 않는 사운드:", name);
    return;
  }

  sound.volume = master_volume;
  sound.currentTime = 0;

  sound.play().catch(error => {
    console.error("사운드 재생 실패:", error);
  });
}

// ========================================
// 7. 업그레이드 버튼
// ========================================

function setupHoldButton(button, upgrade) {
  let hold_interval = null;

  function startUpgrade(event) {
    if (event) event.preventDefault();

    if (hold_interval !== null) return;

    const success = upgrade.buy();

    if (!success) return;

    hold_interval = setInterval(() => {
      if (!upgrade.buy()) {
        stopUpgrade();
      }
    }, 50);
  }

  function stopUpgrade() {
    clearInterval(hold_interval);
    hold_interval = null;
  }

  button.addEventListener("pointerdown", startUpgrade);
  button.addEventListener("pointerup", stopUpgrade);
  button.addEventListener("pointerleave", stopUpgrade);
  button.addEventListener("pointercancel", stopUpgrade);
  button.addEventListener("contextmenu", event => event.preventDefault());
}

function createUpgradeButton(upgrade, name) {
  const button = document.createElement("button");

  button.className = "upgrade_btn";
  button.innerText = name;

  document.getElementById("upgrade_container").appendChild(button);

  upgrade.button = button;
  setupHoldButton(button, upgrade);

  return button;
}

// ========================================
// 8. 룬 뽑기
// ========================================

function drawRune() {
  const language = document.getElementById("language-button");
  const cost = new Big_Num(1, 2);

  if (game.score.count.lt(cost)) {
    if (language.textContent.trim() == "한국어") {
      document.getElementById("rune-result").textContent =
        "점수가 부족합니다";
    }
    else {
      document.getElementById("rune-result").textContent =
        "Not enough score";
    }
    return;
  }

  game.score.count = game.score.count.copy().sub(cost);

  const rune = game.grade_rune_pack.roll();

  document.getElementById("rune-result").textContent =
    `${rune.name} 획득!`;

  updateRuneInventory();
  game.text_UI();
}

function updateRuneInventory() {
  const inventory = document.getElementById("rune-inventory");
  inventory.replaceChildren();

  game.grade_rune_pack.runes.forEach(rune => {
    const p = document.createElement("p");
    p.textContent = `${rune.name}: ${rune.count.format()}`;
    inventory.appendChild(p);
  });
}

document.getElementById("rune-roll-button")
  .addEventListener("click", drawRune);

// ========================================
// 9. 저장 및 불러오기
// ========================================

const SAVE_KEY = "nameless_prestige_save";

// ========================================
// 9-1. 저장 데이터 설정
// ========================================

const SAVE_VERSION = 3;

const BACKUP_KEY = SAVE_KEY + "_backup";

// ========================================
// 9-2. 재화 직렬화
// ========================================

function serializeCurrency(currency) {
  return {
    mantissa: currency.count.mantissa,
    exponent: currency.count.exponent
  };
}

// ========================================
// 9-3. 재화 데이터 검사
// ========================================

function isValidCurrency(data) {
  return (
    data &&
    typeof data === "object" &&
    Number.isFinite(data.mantissa) &&
    Number.isFinite(data.exponent)
  );
}

// ========================================
// 9-4. 저장 데이터 검사
// ========================================

function isValidSaveData(data) {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return false;
  }

  const currencies = [
    "funds",
    "multi",
    "rebirth",
    "ultra",
    "prestige",
    "mega",
    "score"
  ];

  for (const key of currencies) {
    if (!isValidCurrency(data[key])) {
      return false;
    }
  }

  if (
    data.runes !== undefined &&
    !Array.isArray(data.runes)
  ) {
    return false;
  }

  if (
    data.runes &&
    !data.runes.every(rune =>
      rune &&
      typeof rune.name === "string" &&
      isValidCurrency(rune)
    )
  ) {
    return false;
  }

  if (
    typeof data.language !== "string" ||
    typeof data.dark_mode !== "boolean" ||
    !Number.isFinite(data.sound)
  ) {
    return false;
  }

  return true;
}

// ========================================
// 9-5. 기본 저장 데이터 생성
// ========================================

function createSaveData() {
  return {
    version: SAVE_VERSION,

    funds: serializeCurrency(game.funds),
    multi: serializeCurrency(game.multi),
    rebirth: serializeCurrency(game.rebirth),
    ultra: serializeCurrency(game.ultra),
    prestige: serializeCurrency(game.prestige),
    mega: serializeCurrency(game.mega),
    score: serializeCurrency(game.score),
    language: document.getElementById("language-button").textContent.trim(),

    dark_mode: document.getElementById("Dark_Mode_Checkbox").checked,

    sound: Number(document.getElementById("Sound_Slider").value),
    
    runes: game.grade_rune_pack.runes.map(rune => ({
      name: rune.name,
      mantissa: rune.count.mantissa,
      exponent: rune.count.exponent
    })),

    lastSave: Date.now()
  };
}

// ========================================
// 9-6. 버전 마이그레이션
// ========================================

function migrateSaveData(data) {
  let version = Number.isInteger(data.version)
    ? data.version
    : 1;

  if (version > SAVE_VERSION || version < 1) {
    throw new Error("지원하지 않는 세이브 버전입니다.");
  }

  // v1 -> v2
  if (version === 1) {
    // v1에 존재하지 않던 데이터의 기본값 처리
    if (!data.score) {
      data.score = {
        mantissa: 0,
        exponent: 0
      };
    }

    if (!Array.isArray(data.runes)) {
      data.runes = [];
    }

    data.version = 2;
    version = 2;

    console.log("세이브 v1 -> v2 업데이트 완료");
  }

  // v2 -> v3
  if (version === 2) {
    data.language ??= "한국어";
    data.dark_mode ??= false;
    data.sound ??= 50;

    data.version = 3;
    version = 3;
  }

  return data;
}

// ========================================
// 9-7. 게임 저장
// ========================================

function saveGame() {
  try {
    const saveData = createSaveData();

    if (!isValidSaveData(saveData)) {
      throw new Error("현재 게임 데이터가 올바르지 않습니다.");
    }

    const newSave = JSON.stringify(saveData);

    // 기존 정상 세이브 백업
    const oldSave = localStorage.getItem(SAVE_KEY);

    if (oldSave) {
      try {
        const parsedOldSave = JSON.parse(oldSave);

        if (isValidSaveData(parsedOldSave)) {
          localStorage.setItem(BACKUP_KEY, oldSave);
        }
      } catch (error) {
        console.warn("기존 세이브가 손상되어 백업하지 않았습니다.");
      }
    }

    localStorage.setItem(SAVE_KEY, newSave);

    console.log("게임 저장 완료!");

  } catch (error) {
    console.error("저장에 실패했습니다.", error);
  }
}

// ========================================
// 9-8. 재화 복원
// ========================================

function restoreCurrency(currency, data) {
  if (isValidCurrency(data)) {
    currency.count = new Big_Num(
      data.mantissa,
      data.exponent
    );

    return true;
  }

  return false;
}

// ========================================
// 9-9. 게임 데이터 적용
// ========================================

function applySaveData(saveData) {
  const currencies = [
    ["funds", game.funds],
    ["multi", game.multi],
    ["rebirth", game.rebirth],
    ["ultra", game.ultra],
    ["prestige", game.prestige],
    ["mega", game.mega],
    ["score", game.score]
  ];

  for (const [key, currency] of currencies) {
    restoreCurrency(currency, saveData[key]);
  }

  // 언어 설정
  document.getElementById("language-button").textContent =
    saveData.language;

  // 다크 모드
  document.getElementById("Dark_Mode_Checkbox").checked =
    saveData.dark_mode;

  // 사운드
  document.getElementById("Sound_Slider").value =
    saveData.sound;

  if (Array.isArray(saveData.runes)) {
    for (const savedRune of saveData.runes) {
      const rune = game.grade_rune_pack.runes.find(
        r => r.name === savedRune.name
      );

      if (rune) {
        restoreCurrency(rune, savedRune);
      }
    }
  }

  updateRuneInventory();
}

// ========================================
// 9-10. 세이브 데이터 읽기
// ========================================

function readSaveData(rawData) {
  const data = JSON.parse(rawData);

  const migratedData = migrateSaveData(data);

  if (!isValidSaveData(migratedData)) {
    throw new Error("저장 데이터가 올바르지 않습니다.");
  }

  return migratedData;
}

// ========================================
// 9-11. 게임 불러오기
// ========================================

function loadGame() {
  const mainSave = localStorage.getItem(SAVE_KEY);
  const backupSave = localStorage.getItem(BACKUP_KEY);

  if (!mainSave && !backupSave) {
    console.log("저장 데이터가 없습니다.");
    return 0;
  }

  const saveSources = [
    { key: SAVE_KEY, data: mainSave, name: "메인 세이브" },
    { key: BACKUP_KEY, data: backupSave, name: "백업 세이브" }
  ];

  for (const source of saveSources) {
    if (!source.data) continue;

    try {
      const saveData = readSaveData(source.data);

      applySaveData(saveData);

      // 마이그레이션된 데이터를 새 버전으로 저장
      const updatedSave = JSON.stringify({
        ...saveData,
        version: SAVE_VERSION
      });

      // 메인 세이브를 불러온 경우 버전 업데이트
      if (source.key === SAVE_KEY) {
        if (updatedSave !== source.data) {
          localStorage.setItem(BACKUP_KEY, source.data);
          localStorage.setItem(SAVE_KEY, updatedSave);

          console.log("세이브 버전 업데이트 완료!");
        }
      }

      // 백업 세이브에서 복구한 경우
      else {
        localStorage.setItem(SAVE_KEY, updatedSave);

        console.warn("백업 세이브로 복구했습니다!");
      }

      const lastSave = Number.isFinite(saveData.lastSave)
        ? saveData.lastSave
        : Date.now();

      return Math.max(
        0,
        (Date.now() - lastSave) / 1000
      );

    } catch (error) {
      console.error(
        source.name + " 불러오기 실패:",
        error
      );
    }
  }

  console.error(
    "메인 세이브와 백업 세이브 모두 복구할 수 없습니다."
  );

  return 0;
}

// ========================================
// 10. 게임 초기화
// ========================================

let isResetting = false;

function resetGame() {
  const confirmReset = confirm(
    "all reset?\nall save is lost"
  );

  if (!confirmReset) return;

  isResetting = true;
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(BACKUP_KEY);
  location.reload();
}

document.getElementById("reset-button")
  .addEventListener("click", resetGame);

// ========================================
// 11. 자금 및 점수 생산
// ========================================

function get_update(delta) {
  let produce = game.multi.count.add(1)
    .mul(game.rebirth.count.add(1))
    .mul(game.ultra.count.add(1))
    .mul(game.prestige.count.add(1))
    .mul(game.mega.count.add(1))
    .mul(new Big_Num(delta, 0));

  const down = new Big_Num(3, -1);

  if (produce.gt(0)) {
    produce = produce.mul(
      new Big_Num(9, -1).pow(
        produce.log10().div(down)
      )
    );
  }

  game.funds.count = game.funds.count.add(produce);

  let score_up = new Big_Num(0, 0);

  if (produce.gt(0)) {
    score_up = produce.add(1)
      .log10()
      .mul(new Big_Num(delta, 0))
      .div(new Big_Num(1, 2));
  }

  game.score.count = game.score.count.add(score_up);
}

function scroll() {
  for (const scrollBox of document.querySelectorAll(".tab-content")) {
    // 중복 생성 방지
    if (scrollBox.dataset.scrollInitialized === "true") {
      continue;
    }

    scrollBox.dataset.scrollInitialized = "true";

    // 스크롤바 요소 자동 생성
    const wrapper = document.createElement("div");
    wrapper.className = "custom-scrollbar";

    const thumb = document.createElement("div");
    thumb.className = "custom-scrollbar-thumb";

    wrapper.appendChild(thumb);

    // 스크롤 영역의 부모에 추가
    scrollBox.parentElement.appendChild(wrapper);

    let hideTimer;

    function updateThumb() {
      const visible = scrollBox.clientHeight;
      const total = scrollBox.scrollHeight;

      if (total <= visible || visible === 0) {
        wrapper.style.display = "none";
        return;
      }

      wrapper.style.display = "block";

      const thumbHeight = Math.max(
        24,
        visible * visible / total
      );

      thumb.style.height =
        Math.min(visible, thumbHeight) + "px";

      const maxScroll = total - visible;
      const maxThumbTop = visible - Math.min(visible, thumbHeight);

      thumb.style.top =
        (scrollBox.scrollTop / maxScroll) * maxThumbTop + "px";
    }

    scrollBox.addEventListener("scroll", () => {
      updateThumb();

      wrapper.classList.add("scrolling");

      clearTimeout(hideTimer);

      hideTimer = setTimeout(() => {
        wrapper.classList.remove("scrolling");
      }, 1000);
    });

    updateThumb();

    new ResizeObserver(updateThumb).observe(scrollBox);
  }
}

function dark_mode_ui_update() {
  const checkbox = document.getElementById("Dark_Mode_Checkbox");

  if (checkbox.checked) {
    document.querySelectorAll(".common").forEach(sub_text => {
      sub_text.classList.add("Dark-Mode")
    });
    document.querySelectorAll(".money").forEach(main_text => {
      main_text.classList.add("Dark-Mode")
    });
    document.querySelectorAll(".tab-content").forEach(tab => {
      tab.classList.add("Dark-Mode")
    })
    document.querySelectorAll("body").forEach(body_obj => {
      body_obj.classList.add("Dark-Mode")
    })
    document.querySelectorAll(".tab-btn").forEach(tab_obj => {
      tab_obj.classList.add("Dark-Mode")
    })
    document.querySelectorAll(".tab-main").forEach(tab_tab => {
      tab_tab.classList.add("Dark-Mode")
    })
    document.querySelectorAll(".dropdown-button").forEach(dropdown_on => {
      dropdown_on.classList.add("Dark-Mode")
    })
    document.querySelectorAll(".dropdown").forEach(dropdown => {
      dropdown.classList.add("Dark-Mode")
    })
  }
  else {
    document.querySelectorAll(".Dark-Mode").forEach(obj => {
      obj.classList.remove("Dark-Mode")
    })
  }
}


function sound_slider_ui_update() {
  const slider = document.getElementById("Sound_Slider");
  const slider_value = document.getElementById("sound-value");

  // 현재 음량 표시
  master_volume = Number(slider.value) / 100;

  slider_value.textContent = `${slider.value}%`;

  // 슬라이더 변경 감지
  slider.addEventListener("input", () => {
    master_volume = Number(slider.value) / 100;

    slider_value.textContent = `${slider.value}%`;
  });
}

function dropdown_btn_ui(btn_id, dropdown_id) {
  const to_button = document.getElementById(btn_id);
  const dropdown = document.getElementById(dropdown_id);
      
  to_button.addEventListener("click", () => {
    dropdown.classList.toggle("locked");
  });
      
  // 메뉴 바깥을 누르면 닫기
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".dropdown-container")) {
      dropdown.classList.add("locked");
    }
  });
      
  // 메뉴 항목을 누르면 선택한 항목 확인
  dropdown.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      to_button.textContent = button.textContent;
      dropdown.classList.add("locked");
    });
  });
}


function get_language() {
  const language = document.getElementById("language-button");

  if (language.textContent.trim() == "한국어") {
    document.querySelectorAll(".language.korean").forEach(korean => {
      korean.classList.remove("locked")
    });
    document.querySelectorAll(".language.english").forEach(english => {
      english.classList.add("locked")
    });
  }
  else {
    document.querySelectorAll(".language.korean").forEach(korean => {
      korean.classList.add("locked")
    });
    document.querySelectorAll(".language.english").forEach(english => {
      english.classList.remove("locked")
    });
  }
}

function ui_update() {
  game.text_UI();
  dark_mode_ui_update();
  get_language();
}

function update(delta) {
  get_update(delta);
  ui_update();
}

// ========================================
// 12. 오프라인 보상 및 게임 루프
// ========================================

const offlineSeconds = loadGame();

if (offlineSeconds > 0) {
  console.log("오프라인 보상 시간:", offlineSeconds, "초");

  // 한 번의 거대한 계산 대신 최대 0.1초 단위로 처리
  let remaining = offlineSeconds;

  while (remaining > 0) {
    const step = Math.min(remaining, 0.1);
    get_update(step);
    remaining -= step;
  }

  saveGame();
}

scroll();

game.text_UI();
updateRuneInventory();

sound_slider_ui_update();

dropdown_btn_ui("language-button", "language-dropdown");


let lastTime = performance.now();

function gameLoop(now) {
  let delta = (now - lastTime) / 1000;

  delta = Math.max(0, Math.min(delta, 0.1));
  lastTime = now;

  update(delta);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// 화면을 닫거나 백그라운드로 보낼 때 저장
window.addEventListener("beforeunload", () => {
  if (!isResetting) saveGame();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && !isResetting) {
    saveGame();
  }
});

// 5초마다 자동 저장
setInterval(() => {
  if (!isResetting) saveGame();
}, 5000);