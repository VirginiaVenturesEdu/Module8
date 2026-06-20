// Money Moves: Your Financial Literacy
// Step 0: Foundation and world shell.
//
// IMPORTANT: always import Three.js types (Mesh, BoxGeometry, etc.) from
// "@iwsdk/core", never from "three" directly, so the whole app shares one copy
// of Three.js.
import {
  World,
  SessionMode,
  Mesh,
  Group,
  Object3D,
  BufferGeometry,
  BoxGeometry,
  PlaneGeometry,
  CircleGeometry,
  CylinderGeometry,
  SphereGeometry,
  ConeGeometry,
  ExtrudeGeometry,
  Shape,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Color,
  CanvasTexture,
  RepeatWrapping,
  DoubleSide,
  Vector3,
  SRGBColorSpace,
  HemisphereLight,
  DirectionalLight,
  PointLight,
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  LocomotionEnvironment,
  EnvironmentType,
  DomeGradient,
  IBLGradient,
  PanelUI,
  PanelDocument,
  UIKit,
  UIKitDocument,
  RayInteractable,
  Hovered,
  AudioSource,
  AudioUtils,
  AudioContext as ThreeAudioContext,
  createSystem,
  eq,
  type Entity,
} from '@iwsdk/core';

// ============================================================
// MONEY MOVES - TUNABLE CONSTANTS
// Change these numbers to adjust difficulty and pacing.
// ============================================================

// --- Starting conditions ---
const STARTING_MONEY = 20;            // birthday money in the piggy bank

// --- Stage 1: Allowance and Saving ---
const ALLOWANCE_PER_WEEK = 10;        // money earned each week
const STAGE1_WEEKS = 3;               // number of weeks in Stage 1
const SAVINGS_INTEREST_RATE = 0.10;   // added to Savings each week (10 percent, exaggerated on purpose)
const FRIEND_OFFER_PRICE = 15;        // price of the rare item the friend offers

// --- Stage 2: First Job and Investing ---
const STAGE2_STARTING_FUNDS = 100;    // money available at the start of Stage 2
const INVEST_GOOD_MULTIPLIER = 1.4;   // grows 40 percent if the business does well
const INVEST_BAD_MULTIPLIER = 0.7;    // shrinks 30 percent if the business struggles
const INVEST_GOOD_PROBABILITY = 0.55; // chance the business does well

// --- Stage 3: Big Decision and Diversification ---
const STAGE3_STARTING_FUNDS = 200;    // money available at the start of Stage 3
const STAGE3_BOOM_MULTIPLIER = 1.5;   // the channel that booms grows 50 percent
const STAGE3_DIP_MULTIPLIER = 0.6;    // the channel that dips shrinks 40 percent
const SURPRISE_EXPENSE = 30;          // unexpected cost that hits in Stage 3

// --- Scoring: Financial Growth ---
const GROWTH_GREAT = 1.3;             // ended with 130 percent or more of money received
const GROWTH_GOOD = 1.1;              // ended with 110 percent or more
const GROWTH_OKAY = 0.9;              // ended with 90 percent or more

// --- Scoring: Financial Security ---
const BUFFER_THRESHOLD = 20;          // safe money needed to earn a buffer bonus
const BUFFER_BONUS = 15;              // points for keeping a buffer each stage
const DIVERSIFY_BONUS = 12;           // points per channel used in Stage 3
const COVERED_EXPENSE_BONUS = 20;     // points for covering the surprise expense safely

// --- Scoring: Money Smarts ---
const VIEWED_INFO_BONUS = 15;         // points for checking risk and reward before deciding
const IMPULSE_PENALTY = 20;           // points lost for an all-in bet or a savings drain
const MATCHED_SITUATION_BONUS = 15;   // points for diversifying when it mattered

// --- UI Palette (friendly, and color-blind safe) ---
// The three meter colors are chosen so they differ in BOTH hue and brightness:
// a mid green, a darker blue, and a lighter purple. That keeps them apart for
// color blindness and even in grayscale. Each meter also carries its own shape
// and word label (see ui/scoreboard.uikitml), so its meaning never rests on
// color alone. If you change a meter color here, change it there to match.
const MONEY_GOLD = '#FFC53D';         // the money total, the bolts, and Penny (always paired with text)
const BILL_GREEN = '#54C57A';         // the dollar bills the student picks up and places
const GROWTH_GREEN = '#2FA45B';       // Financial Growth meter (mid-bright green, "grow" up-arrow chip)
const SECURITY_BLUE = '#1C6FB5';      // Financial Security meter (deeper blue, square "shield" chip)
const SMARTS_VIOLET = '#BD6BD6';      // Money Smarts meter (lighter orchid, "star" chip)
const CORAL = '#FF7A59';              // accent for buttons and highlights
const SKY_BLUE = '#DFF3FF';           // soft background and sky
const PANEL_CREAM = '#FFF6E5';        // panel and scoreboard backgrounds
const INK_DARK = '#3A2E39';           // friendly dark text
const LOSS_RED = '#E24B4A';           // losses and dips (used in a later step)

// --- Bills (how much each dollar bill is worth in each round) ---
const BILL_VALUE_TUTORIAL = 1;       // a $1 bill in the practice round
const BILL_VALUE_STAGE1 = 1;         // a $1 bill in Stage 1
const BILL_VALUE_STAGE2 = 10;        // a $10 bill in Stage 2
const BILL_VALUE_STAGE3 = 20;        // a $20 bill in Stage 3 (there is no $25 bill)
const TUTORIAL_PRACTICE_MONEY = 5;   // pretend dollars for the test round

// --- Interaction feel ---
const BILL_FLY_TIME = 0.45;          // seconds for a bill to arc into a container

// --- Stage 1 scoring (small nudges, tune to taste) ---
const SAVE_BONUS = 5;       // a little Growth and Security each week you put money in savings
const INTEREST_BONUS = 5;   // a little Growth each time your savings earns interest

// --- Stage 2 scoring (tune to taste) ---
const INVEST_GROWTH_BONUS = 10;   // Growth when your investment does well

// --- Stage 2 investment tiers (how much you can put into Max's truck) ---
const INVEST_TIER_HIGH = 40;   // the bigger investment option, shown when you can afford it
const INVEST_TIER_LOW = 20;    // the smaller investment option, shown when you can afford it

// --- Stage 3 scoring (tune to taste) ---
const DIVERSIFY_MIN_CHANNELS = 3;   // how many of the 4 places you must use to count as spreading out

// --- Step 7 summary (how the end-of-game money personality is decided) ---
const PERSONALITY_RATIO = 1.5;       // one money bucket must beat the other by this much to set your type
const SUMMARY_CLOSE_DOLLARS = 2;     // ending within this many dollars of your start counts as "held on"

// ============================================================
// FOUNDATION SCENE CONSTANTS
// Layout, lighting, and scoreboard knobs for the world shell, kept in one
// labeled place so the scene logic below never holds a raw number.
// ============================================================

// --- Player and view ---
const EYE_HEIGHT = 1.6;                // standing eye height in meters (browser start view)
const PLAYER_START_Z = 2.0;           // how far back from the room center you start
const VIEW_TILT = -0.06;              // a gentle downward tilt so you take in the room

// --- Room shell (a small bright toy room) ---
const ROOM_WIDTH = 6;                 // left to right size in meters
const ROOM_DEPTH = 5;                 // front to back size in meters
const WALL_HEIGHT = 3;                // how tall the walls are in meters
const WALL_THICKNESS = 0.2;           // chunky toy walls
const SURFACE_ROUGHNESS = 0.9;        // matte, soft sheen for the lit surfaces

// --- Desk (a chunky toy desk in the corner) ---
const DESK_WIDTH = 1.5;
const DESK_DEPTH = 0.7;
const DESK_HEIGHT = 0.9;
const DESK_TOP_THICKNESS = 0.12;
const DESK_LEG_RADIUS = 0.06;
const DESK_MARGIN = 0.4;              // gap kept between the desk and the walls

// --- Scoreboard (a 3D sign mounted on the back wall) ---
const SCOREBOARD_CONFIG = './ui/scoreboard.json'; // compiled from ui/scoreboard.uikitml
const SCOREBOARD_WIDTH = 2.0;         // panel width in meters
const SCOREBOARD_HEIGHT = 1.4;        // panel height in meters
const SCOREBOARD_Y = 1.6;             // center height (eye level) in meters
const SCOREBOARD_FRAME_PAD = 0.14;    // how far the chunky frame sticks out past the panel
const SCOREBOARD_FRAME_DEPTH = 0.16;  // thickness of the frame box in meters
const PANEL_FACE_OFFSET = 0.02;       // nudge the panel just in front of the frame face
const BOLT_RADIUS = 0.06;             // little gold corner bolts on the frame
const METER_TRACK_WIDTH = 24;         // MUST match the .track width in ui/scoreboard.uikitml

// --- Lighting (a soft ambient fill plus one gentle key light) ---
const EXPOSURE = 1.0;                 // overall brightness after tone mapping
const SHADOW_MAP_SIZE = 1024;         // shadow resolution (1024 is smooth on Quest)
const SHADOW_EXTENT = 8;              // how wide the key light's shadow area reaches
const HEMI_SKY_COLOR = '#FFF4E2';     // warm fill light coming from above
const HEMI_GROUND_COLOR = '#F0E2C4';  // warm fill bounced up from the floor
const HEMI_INTENSITY = 0.85;          // strength of the soft ambient fill
const KEY_COLOR = '#FFF4E6';          // warm key light
const KEY_INTENSITY = 1.4;            // strength of the one gentle key light
const KEY_POSITION = [5, 6, 4];       // up high and off to one side for soft shadows

// --- Sky dome (a soft cheerful gradient) ---
const SKY_TOP_COLOR = '#BFE6FF';      // a touch deeper blue overhead
const SKY_INTENSITY = 1.0;            // how bright the sky dome is
// The sky dome's horizon uses SKY_BLUE and its ground uses PANEL_CREAM.

// ============================================================
// MONEY ROUND SCENE CONSTANTS
// Layout and feel knobs for the reusable money round (the cash station,
// the pick-and-place, and the little animations). Kept here so the round
// logic below never holds a raw number. None of these change game values.
// ============================================================

// --- The money station table the round builds for itself ---
// Negative z is "in front of you" for both viewers: the browser starts at the
// back of the room (PLAYER_START_Z) and the headset starts at the room center,
// and both look toward -z, so the station sits ahead of each of them.
const MONEY_TABLE_CENTER_Z = -0.75;   // table sits in front of where you stand
const MONEY_TABLE_WIDTH = 2.4;        // left to right size in meters
const MONEY_TABLE_DEPTH = 1.1;        // front to back size in meters
const MONEY_TABLE_Y = 0.9;            // height of the table top (a comfy working height)
const MONEY_TABLE_TOP_THICKNESS = 0.1;
const MONEY_TABLE_LEG_RADIUS = 0.06;

// --- The cash tray and the dollar bills ---
const BILL_WIDTH = 0.12;              // a chunky toy dollar bill, left to right
const BILL_DEPTH = 0.06;              // front to back (a 2 to 1 banknote shape)
const BILL_THICKNESS = 0.008;         // bills are thin and flat
const BILL_REST_GAP = 0.006;          // tiny gap so a resting bill sits just above the tray
const TRAY_CENTER_Z = -0.45;          // tray on the near (player) half of the table
const TRAY_WIDTH = 1.3;
const TRAY_DEPTH = 0.34;
const TRAY_FLOOR_THICKNESS = 0.02;    // the thin dish bottom the bills rest on
const BILLS_PER_ROW = 5;              // bills wrap to a new row after this many
const BILL_SLOT_PITCH_X = 0.2;        // spacing between bills across a row
const BILL_SLOT_PITCH_Z = 0.12;       // spacing between bill rows

// --- The dollar bill face (a green bill with its value printed on it) ---
const BILL_EDGE_GREEN = '#1F7A47';    // the darker green border and the printed amount
const BILL_FACE_CREAM = '#F3FBEE';    // the pale center panel the amount sits on
const BILL_CANVAS_W = 256;            // bill face texture width (a 2 to 1 banknote)
const BILL_CANVAS_H = 128;            // bill face texture height

// --- The jars (simple bill catchers; stages dress these up later) ---
const JAR_RADIUS = 0.13;
const JAR_HEIGHT = 0.2;
const JAR_CENTER_Z = -1.1;            // jars on the far half of the table
const JAR_ROW_SPACING_X = 0.7;        // spacing between jars across the table
const JAR_BILL_STACK_STEP = 0.022;    // how much each added bill stacks up inside a jar

// --- Bill flight and jar highlight feel ---
const JAR_HIGHLIGHT_EMISSIVE = 0.65;  // how strongly a jar or button glows when you point at it
const JAR_GLOW_LERP = 14;             // how quickly a glow eases in and out
const BILL_ARC_HEIGHT = 0.45;         // how high a bill arcs up and over as it flies to a jar
const BILL_SPIN_TURNS = 2;            // whole tumbles a bill makes while it flies

// --- Animation feel (springy ease-out and squash-and-bounce) ---
const SPRING_OVERSHOOT = 1.7;         // how far a springy tween overshoots before it settles
const SQUASH_AMOUNT = 0.22;           // how much a squash-and-bounce squishes (0 to 1)
const SQUASH_TIME = 0.32;             // seconds for one squash-and-bounce

// --- The readout, the labels, and the Done button ---
const ROUND_READOUT_Y = 1.12;         // the money-left readout floats here above the tray
const ROUND_INSTRUCTION_Y = 1.62;     // the instruction line floats up here
const LABEL_HEIGHT = 0.085;           // world height of a one line label chip
const JAR_LABEL_GAP = 0.13;           // how far the label sits above the jar mouth
const JAR_AMOUNT_GAP = 0.04;          // how far the amount sits above the jar mouth
const DONE_BUTTON_W = 0.36;
const DONE_BUTTON_H = 0.16;
const DONE_BUTTON_D = 0.13;
const DONE_BUTTON_X = 0.9;            // Done button stands on the table, off to the right
const DONE_BUTTON_Z = -0.45;
const DONE_DISABLED_GRAY = '#C9BBA8'; // the Done button is muted until you finish

// --- Take-back buttons (one stands in front of each jar) ---
const TAKEBACK_W = 0.3;               // width of a take-back button
const TAKEBACK_H = 0.1;               // height of a take-back button
const TAKEBACK_D = 0.05;              // depth of a take-back button
const TAKEBACK_Z_OFFSET = 0.27;       // how far in front of its jar a take-back button stands
const TAKEBACK_COLOR = '#F4C77A';     // soft gold, lighter than a bill, so it reads as a gentle button

const MESSAGE_Y = 1.45;               // a temporary message floats here
const MESSAGE_SHOW_TIME = 3.4;        // seconds a temporary message stays up before it fades

// ============================================================
// STEP 1B SCENE CONSTANTS - juice and sound
// New tunable numbers for the sound system, the particle bursts, the
// counting-up numbers, and the speaker (mute) button. Added as their own
// labeled subsections so nothing above changes.
// ============================================================

// --- Sound ---
const SFX_VOLUME = 0.7;        // sound effect loudness, 0 to 1
const MUSIC_VOLUME = 0.3;      // background music loudness, 0 to 1

// --- Particle bursts ---
const BURST_SMALL = 6;         // sparkles when a bill lands
const BURST_BIG = 16;          // sparkles on a win (pressing Done)
const BURST_TIME = 0.7;        // seconds the sparkles last

// --- Number animation ---
const COUNT_TIME = 0.4;        // seconds for a number to count up to its new value

// --- Sound files (CC0 placeholders; drop nicer ones into public/audio/ later) ---
const SFX_CLICK_SRC = '/audio/click.wav'; // soft click when you pick up a bill or press a button
const SFX_CASH_SRC = '/audio/cash.wav';   // soft cash sound when a bill lands in a jar
const SFX_CHIME_SRC = '/audio/chime.mp3';  // happy chime when you finish a round
const MUSIC_SRC = '/audio/music.wav';     // gentle looping background music

// --- Particle burst look and motion ---
const SPARKLE_RADIUS = 0.012;         // size of one little gold sparkle
const SPARKLE_SPEED_MIN = 0.5;        // slowest outward fly speed (meters per second)
const SPARKLE_SPEED_MAX = 1.2;        // fastest outward fly speed
const SPARKLE_RISE_MIN = 0.7;         // slowest upward pop (meters per second)
const SPARKLE_RISE_MAX = 1.6;         // fastest upward pop
const SPARKLE_GRAVITY = 3.2;          // how quickly sparkles fall back down
const JAR_BURST_Y = MONEY_TABLE_Y + JAR_HEIGHT; // a bill-landing burst starts at the jar mouth
const DONE_BURST_Y = MONEY_TABLE_Y + 0.45;      // the win burst pops up above the table

// --- The speaker (mute) button standing in the room ---
const SPEAKER_X = -1.6;               // off to your left, clear of the money station
const SPEAKER_Y = 1.2;                // a comfy height to point at
const SPEAKER_Z = -0.15;              // in front of you, beside the table
const SPEAKER_W = 0.34;               // button width
const SPEAKER_H = 0.16;               // button height
const SPEAKER_D = 0.08;               // button depth
const SPEAKER_POST_RADIUS = 0.025;    // the little stand under the button
const SPEAKER_ON_COLOR = '#3FC56B';   // green when sound is on
const SPEAKER_OFF_COLOR = '#C9BBA8';  // muted gray when sound is off

// ============================================================
// STEP 2 SCENE CONSTANTS - the guide, the avatar pick, and onboarding
// Layout and feel knobs for Penny the guide coin, her speech bubble, the
// avatar pick, and the bouncy arrow she points at the scoreboard with. Kept
// here so the onboarding logic below never holds a raw number. None of these
// change game values.
// ============================================================

// --- Penny, the guide coin character ---
const PENNY_X = 1.7;                  // off to your right, clear of the money station
const PENNY_Y = 1.25;                 // height of Penny's center (a comfy talking height)
const PENNY_Z = -0.9;                 // in front of both viewers (negative z is "ahead")
const PENNY_RADIUS = 0.28;            // a big chunky coin so she reads as a character
const PENNY_THICKNESS = 0.09;         // how thick her coin body is
const PENNY_TURN = -0.35;             // turn her slightly toward you and the bubble (radians)
const PENNY_FACE_INK = INK_DARK;      // her friendly eyes and smile
const PENNY_CHEEK = '#FF9E80';        // soft rosy cheeks (a warm coral tint)
const PENNY_BOB_AMP = 0.05;           // how far she gently bobs up and down (meters)
const PENNY_BOB_SPEED = 1.8;          // how quickly she bobs
const PENNY_SWAY = 0.06;              // a small happy tilt as she bobs (radians)

// --- The speech bubble Penny talks in ---
const GUIDE_BUBBLE_X = 0.78;          // bubble sits to Penny's left, clear of the scoreboard center
const GUIDE_BUBBLE_Y = 1.55;          // near eye level so it is easy to read
const GUIDE_BUBBLE_Z = -0.9;          // same depth as Penny
const GUIDE_BUBBLE_W = 1.25;          // bubble width in meters (matches the canvas aspect below)
const GUIDE_BUBBLE_H = 0.95;          // bubble height in meters
const GUIDE_BUBBLE_CANVAS_W = 1024;   // bubble texture width (crisp, readable text)
const GUIDE_BUBBLE_CANVAS_H = 780;    // bubble texture height (same 1.25 : 0.95 aspect)
const GUIDE_TAIL_SIZE = 0.12;         // the little pointer from the bubble toward Penny
const GUIDE_BUBBLE_BORDER = '#E3D4B6'; // a soft warm outline so the bubble reads as a finished card
const GUIDE_BUTTON_W = 0.5;           // Penny's Next/Got it/Start button width
const GUIDE_BUTTON_H = 0.18;
const GUIDE_BUTTON_D = 0.12;
const GUIDE_BUTTON_DROP = 0.62;       // how far below the bubble center the button sits
const GUIDE_POP_TIME = 0.34;          // seconds for the bubble to pop into view

// --- The avatar pick (four placeholder characters, easy to swap for art) ---
const AVATAR_PANEL_Z = -1.1;          // the four characters stand here, in front of you
const AVATAR_Y = 1.25;                // height of each character's center
const AVATAR_SPACING_X = 0.62;        // space between the four characters
const AVATAR_BODY_RADIUS = 0.17;      // a round little body
const AVATAR_TOPPER_SIZE = 0.1;       // the small shape on each one's head (so they differ)
const AVATAR_PEDESTAL_RADIUS = 0.22;  // the disc each one stands on
const AVATAR_PEDESTAL_H = 0.05;
const AVATAR_PEDESTAL_COLOR = '#EAE1D2'; // a neutral pedestal (matches the meter track)
const AVATAR_PICK_SCALE = 1.18;       // the chosen character grows a little
const AVATAR_HIGHLIGHT_EMISSIVE = 0.7; // how brightly the chosen pedestal glows
const AVATAR_CONTINUE_X = 0;          // the Continue button, centered in front of the four
const AVATAR_CONTINUE_Y = 0.95;
const AVATAR_CONTINUE_Z = -0.75;
const AVATAR_CONTINUE_W = 0.62;
const AVATAR_CONTINUE_H = 0.18;
const AVATAR_CONTINUE_D = 0.12;

// The four avatars: a name (stored in game.avatar) and a color, clearly
// different from each other. Placeholder characters for now.
const AVATARS = [
  { name: 'Green', color: GROWTH_GREEN },
  { name: 'Blue', color: SECURITY_BLUE },
  { name: 'Purple', color: SMARTS_VIOLET },
  { name: 'Orange', color: CORAL },
] as const;

// --- The scoreboard pointer (Penny gestures with a bouncy arrow) ---
const POINTER_COLOR = CORAL;          // a bright coral arrow
const POINTER_RADIUS = 0.07;          // arrow thickness
const POINTER_HEIGHT = 0.18;          // arrow length
const POINTER_EMISSIVE = 0.6;         // it glows so it stands out against the board
const POINTER_Z = -1.95;              // floats just in front of the scoreboard on the back wall
const POINTER_METERS_Y = 1.35;        // points at the three meters (lower on the board)
const POINTER_MONEY_Y = 2.05;         // points at the money total (top of the board)
const POINTER_BOB_AMP = 0.06;         // how far the arrow bobs toward the board
const POINTER_BOB_SPEED = 4.0;        // how quickly the arrow bobs

// --- Penny's soft talking blip (CC0 placeholder; swap a nicer one in later) ---
const SFX_BLIP_SRC = '/audio/blip.wav';

// ============================================================
// STEP 3 SCENE CONSTANTS - the scenario engine
// Layout and feel knobs for the choice presenter (the question card, the row of
// option buttons, and the "See the risk and reward" info button and the card it
// reveals). Kept here so the scenario logic below never holds a raw number. None
// of these change game values.
// ============================================================

// --- The choice screen (a question card above a row of chunky buttons) ---
const CHOICE_CENTER_Z = -0.9;          // the choice sits in front of both viewers
const CHOICE_PROMPT_Y = 1.68;          // the question card floats above the buttons
const CHOICE_PROMPT_H = 0.46;          // question card world height in meters
const CHOICE_PROMPT_CANVAS_W = 1024;   // question card texture width
const CHOICE_PROMPT_CANVAS_H = 330;    // question card texture height
const CHOICE_POP_TIME = 0.34;          // seconds for a card to pop into view

// --- The option buttons ---
const CHOICE_BUTTON_Y = 1.18;          // the buttons stand at a comfy pointing height
const CHOICE_BUTTON_W = 0.6;           // one option button width
const CHOICE_BUTTON_H = 0.26;          // one option button height
const CHOICE_BUTTON_D = 0.13;          // one option button depth
const CHOICE_BUTTON_GAP = 0.2;         // gap between option buttons in the row
const CHOICE_BUTTON_COLOR = CORAL;     // the chunky cartoon option buttons

// --- The "See the risk and reward" info button and the card it reveals ---
const INFO_BUTTON_LABEL = 'See the risk and reward';
const INFO_BUTTON_Y = 0.82;            // the info button sits below the options
const INFO_BUTTON_W = 0.92;            // a wide button so the long label fits
const INFO_BUTTON_H = 0.18;
const INFO_BUTTON_D = 0.1;
const INFO_BUTTON_COLOR = SECURITY_BLUE; // a calm blue, set apart from the options
const INFO_PANEL_X = -1.45;            // the revealed card floats left, clear of the buttons
const INFO_PANEL_Y = 1.4;              // a touch above the option buttons
const INFO_PANEL_H = 0.78;             // info card world height in meters
const INFO_PANEL_CANVAS_W = 720;       // info card texture width
const INFO_PANEL_CANVAS_H = 600;       // info card texture height

// ============================================================
// STEP 4 SCENE CONSTANTS - the Stage 1 places and Max
// Layout, size, and color knobs for the three money places the Stage 1
// allowance rounds sort into (a toy store for Spend Now, a piggy bank, and a
// savings bank) and for Max, the friend who runs in with a rare card. The
// interactive bill targets are still the jars showMoneyRound builds at these
// spots; these landmarks stand just behind each jar to give the three places
// their cartoon look. None of these change game values.
// ============================================================

// --- Where the three places stand (one behind each allowance jar) ---
const PLACE_Z = JAR_CENTER_Z - 0.55;       // just behind the jars, toward the back wall
const PLACE_SPACING_X = JAR_ROW_SPACING_X; // line up with the three jars

// --- The toy store (Spend Now): a little shelf of toys ---
const STORE_COLOR = '#C98A5E';             // warm toy-shelf wood
const STORE_WIDTH = 0.52;
const STORE_HEIGHT = 1.0;
const STORE_DEPTH = 0.28;
const STORE_SHELF_THICKNESS = 0.04;
const STORE_TOY_COLORS = [GROWTH_GREEN, CORAL, SMARTS_VIOLET, SECURITY_BLUE]; // bright toys
const STORE_TOY_SIZE = 0.08;

// --- The piggy bank: a chunky pink piggy on a stand ---
const PIGGY_PINK = '#FF9EC4';              // classic cartoon piggy pink
const PIGGY_BODY_RADIUS = 0.2;
const PIGGY_STAND_RADIUS = 0.16;
const PIGGY_STAND_HEIGHT = 0.6;            // lifts the piggy up so it reads above the table
const PIGGY_STAND_COLOR = PANEL_CREAM;
const PIGGY_SNOUT_COLOR = '#F47FB0';       // a slightly deeper pink snout and legs
const PIGGY_SLOT_COLOR = INK_DARK;         // the dark coin slot on its back

// --- The savings bank: a little vault building ---
const BANK_COLOR = '#9FB7C9';              // calm steel-blue building
const BANK_WIDTH = 0.5;
const BANK_BODY_HEIGHT = 0.62;
const BANK_DEPTH = 0.34;
const BANK_STAND_HEIGHT = 0.32;            // a base so the building rises into view
const BANK_ROOF_COLOR = SECURITY_BLUE;     // a bright roof so it pops
const BANK_ROOF_HEIGHT = 0.22;
const BANK_COLUMN_RADIUS = 0.035;
const BANK_DOOR_COLOR = MONEY_GOLD;        // a round gold vault door
const BANK_DOOR_RADIUS = 0.13;

// --- Max, the friend with the rare card ---
const MAX_REST_X = 1.15;                   // where Max stops, between the buttons and Penny
const MAX_START_X = 2.4;                   // off to the right, where he runs in from
const MAX_Z = -0.5;                        // in front of the choice, clear of the table
const MAX_WALK_TIME = 0.7;                 // seconds for Max to run in
const MAX_RUN_BOUNCE = 0.05;               // how high he bobs while running in
const MAX_BODY_RADIUS = 0.17;
const MAX_BODY_COLOR = CORAL;              // a friendly bright kid
const MAX_HEAD_RADIUS = 0.13;
const MAX_HEAD_COLOR = '#FFD9B8';          // warm skin tone (placeholder)
const MAX_HAIR_COLOR = '#7A4E2D';          // simple hair
const MAX_LEG_HEIGHT = 0.34;
const MAX_LEG_COLOR = SECURITY_BLUE;       // blue pants
const MAX_CARD_W = 0.13;                   // the shiny rare card he holds up
const MAX_CARD_H = 0.19;
const MAX_CARD_THICKNESS = 0.012;
const MAX_CARD_COLOR = '#7FE9FF';          // a bright holo cyan
const MAX_CARD_EMISSIVE = 0.5;             // it glows so it reads as rare and shiny

// ============================================================
// STEP 5 SCENE CONSTANTS - Max's food truck (Stage 2)
// Layout, size, and color knobs for the cartoon food truck Max runs in Stage 2,
// plus its busy (a hit) and quiet (a slow month) looks, the little customers,
// and where Max stands beside it. None of these change game values. Kept here so
// the Stage 2 scene logic below never holds a raw number.
// ============================================================

// --- The food truck body (a chunky cartoon truck in the bright style) ---
const TRUCK_X = -1.85;                 // off to your left, clear of the money station
const TRUCK_Z = -1.55;                 // toward the back, beside the Stage 1 places
const TRUCK_FACE_TURN = 0.4;           // turned a little toward the room center (radians)
const TRUCK_BODY_W = 1.1;              // the box body, left to right
const TRUCK_BODY_H = 0.6;              // body height
const TRUCK_BODY_D = 0.6;              // body front to back
const TRUCK_BODY_Y = 0.62;            // height of the body center (it sits up on its wheels)
const TRUCK_BODY_COLOR = '#FFD166';    // a sunny cartoon truck yellow
const TRUCK_CAB_W = 0.45;              // the little driver cab at one end
const TRUCK_CAB_COLOR = CORAL;         // a coral cab so it pops
const TRUCK_WHEEL_RADIUS = 0.16;       // chunky toy wheels
const TRUCK_WHEEL_COLOR = INK_DARK;    // dark rubber
const TRUCK_WINDOW_W = 0.62;           // the serving window on the player-facing side
const TRUCK_WINDOW_H = 0.3;            // serving window height
const TRUCK_WINDOW_COLOR = INK_DARK;   // a dark serving opening
const TRUCK_AWNING_COLOR = BILL_GREEN; // a bright awning over the window
const TRUCK_SIGN_COLOR = PANEL_CREAM;  // the roof sign board
const TRUCK_DIM_COLOR = '#9AA0A6';     // a grey wash for the quiet (slow) look

// --- The little customers that line up when the truck is a hit (busy look) ---
const CUSTOMER_COLORS = [SECURITY_BLUE, SMARTS_VIOLET, CORAL]; // three bright kids
const CUSTOMER_BODY_RADIUS = 0.12;     // a round little customer body
const CUSTOMER_SPACING = 0.28;         // space between customers in the line

// --- Where Max stands in Stage 2 (right next to his food truck) ---
const MAX_STAGE2_X = -1.0;             // beside the truck, facing you
const MAX_STAGE2_Z = -1.2;

// ============================================================
// STEP 6 SCENE CONSTANTS - the Stage 3 places (your storefront and the big dream)
// Layout, size, and color knobs for the two new Stage 3 landmarks: your own
// storefront (with a busy and a quiet look, like the food truck) and the big
// dream goal (a little model house topped with a glowing gold star). Max's food
// truck and the savings bank are reused from earlier stages. The interactive
// bill targets are still the four jars showMoneyRound builds on the table; these
// landmarks give the four places their cartoon look. None of these change game
// values. Kept here so the Stage 3 scene logic below never holds a raw number.
// ============================================================

// --- The four Stage 3 jars across the money table (closer than the 3-jar rows) ---
const STAGE3_JAR_SPACING_X = 0.62;     // spacing between the four jars on the table

// --- Your own storefront (the shop that stands for your business) ---
const SHOP_X = 2.0;                    // far right, mirroring Max's truck on the left
const SHOP_Z = -1.55;                  // toward the back, beside the other places
const SHOP_FACE_TURN = -0.4;           // turned a little toward the room center (radians)
const SHOP_BODY_W = 0.9;               // the shop box, left to right
const SHOP_BODY_H = 0.66;              // shop height
const SHOP_BODY_D = 0.5;               // shop front to back
const SHOP_WALL_COLOR = PANEL_CREAM;   // bright cream walls
const SHOP_ROOF_COLOR = CORAL;         // a coral roof so it reads as "yours"
const SHOP_ROOF_H = 0.24;              // the peaked roof height
const SHOP_DOOR_COLOR = '#8A5A3B';     // a warm wood door
const SHOP_DOOR_W = 0.22;
const SHOP_DOOR_H = 0.34;
const SHOP_WINDOW_COLOR = SECURITY_BLUE; // bright cartoon glass
const SHOP_AWNING_COLOR = GROWTH_GREEN;  // a cheerful awning over the front
const SHOP_SIGN_COLOR = PANEL_CREAM;   // the shop sign board
const SHOP_DIM_COLOR = '#9AA0A6';      // the grey wash for the quiet (slow) look

// --- The big dream goal (a little model house topped with a gold wishing star) ---
const DREAM_X = 1.3;                   // back right, in the open gap between the bank and your shop
const DREAM_Z = -2.0;                  // deep, clear of the table, the truck, and the scoreboard
const DREAM_STAND_RADIUS = 0.16;       // the post the dream house sits on
const DREAM_STAND_HEIGHT = 0.5;        // lifts the dream up so it reads above the table
const DREAM_STAND_COLOR = PANEL_CREAM;
const DREAM_HOUSE_W = 0.34;            // the little model house body
const DREAM_HOUSE_H = 0.28;
const DREAM_HOUSE_D = 0.3;
const DREAM_HOUSE_COLOR = '#FFE3A3';   // a warm sunny house
const DREAM_ROOF_COLOR = CORAL;        // a bright peaked roof
const DREAM_ROOF_H = 0.2;
const DREAM_DOOR_COLOR = '#8A5A3B';    // a little wood door
const DREAM_STAR_COLOR = MONEY_GOLD;   // a glowing gold wishing star on top
const DREAM_STAR_OUTER = 0.12;         // star outer radius
const DREAM_STAR_INNER = 0.05;         // star inner radius
const DREAM_STAR_POINTS = 5;           // a classic five point star
const DREAM_STAR_DEPTH = 0.03;         // how thick the star plaque is
const DREAM_STAR_GAP = 0.05;           // gap between the roof tip and the star
const DREAM_STAR_EMISSIVE = 0.5;       // it glows so it reads as a wishing star

// ============================================================
// STEP 7 SCENE CONSTANTS - the Money Report board (the end-of-game summary)
// Layout, size, color, and feel knobs for the friendly Money Report poster that
// stands in front of the player at the end: a journey chart (four money bars), the
// three skill meters, and a money personality badge. Penny presents it from her
// usual spot on the right. None of these change game values; they only lay out and
// animate numbers that are already filled in. Kept here so the summary logic below
// never holds a raw number.
// ============================================================

// --- The board itself (a big cream poster with a coral frame, in front of you) ---
const REPORT_X = 0;                   // centered left to right in front of both viewers
const REPORT_Y = 1.5;                 // center height (eye level), like the scoreboard
const REPORT_Z = -1.4;                // in front of the room props, behind Penny's bubble
const REPORT_W = 2.4;                 // poster width in meters
const REPORT_H = 1.9;                 // poster height in meters
const REPORT_FACE_DEPTH = 0.06;       // thickness of the cream face panel
const REPORT_FRAME_PAD = 0.1;         // how far the coral frame sticks out past the face
const REPORT_FRAME_DEPTH = 0.05;      // thickness of the coral frame behind the face
const REPORT_CONTENT_Z = 0.08;        // local z that lays the bars and labels just in front of the face
const REPORT_TITLE_TEXT = 'Money Report';
const REPORT_TITLE_LOCAL_Y = 0.8;     // the title banner sits near the top of the board
const REPORT_TITLE_H = 0.18;          // title chip world height

// --- Section A: the journey chart (four money bars for your life so far) ---
const JOURNEY_BASE_LOCAL_Y = 0.12;    // the bars all grow up from this baseline
const JOURNEY_BAR_MAX_H = 0.46;       // the tallest bar (the most money) is this tall
const JOURNEY_BAR_MIN_H = 0.04;       // even the smallest amount shows at least this tall
const JOURNEY_BAR_W = 0.3;            // one bar width
const JOURNEY_BAR_D = 0.06;           // one bar depth (a little chunky)
const JOURNEY_BAR_PITCH = 0.56;       // spacing between the four bars across the board
const JOURNEY_BAR_COLOR = MONEY_GOLD; // gold, the same color as the money total
const JOURNEY_PERIOD_LABELS = ['As a Kid', 'First Job', 'Grown Up', 'Now'] as const;
const JOURNEY_PERIOD_LOCAL_Y = 0.0;   // the period labels sit just below the baseline
const JOURNEY_PERIOD_H = 0.075;       // period label chip world height
const JOURNEY_AMOUNT_H = 0.075;       // dollar amount chip world height
const JOURNEY_AMOUNT_GAP = 0.055;     // how far the amount floats above its bar's top

// --- Section B: the three skill meters (green, blue, violet, out of 100) ---
const METER_BASE_LOCAL_Y = -0.84;     // the meter bars grow up from this baseline (lower left)
const METER_BAR_MAX_H = 0.44;         // a full meter (value 100) is this tall
const METER_BAR_W = 0.22;             // one meter bar width
const METER_BAR_D = 0.06;             // one meter bar depth
const METER_CENTER_X = -0.6;          // the three meters sit on the left, clear of the badge
const METER_BAR_PITCH = 0.32;         // spacing between the three meter bars
const METER_BAR_COLORS = [GROWTH_GREEN, SECURITY_BLUE, SMARTS_VIOLET] as const;
const METER_BAR_LABELS = ['Growth', 'Security', 'Smarts'] as const;
const METER_LABEL_LOCAL_Y = -0.9;     // the short meter labels sit below the bars
const METER_LABEL_H = 0.06;           // meter label chip world height
const METER_VALUE_H = 0.06;           // meter value chip world height
const METER_VALUE_GAP = 0.05;         // how far the value floats above its bar's top
const METER_VALUE_MAX = 100;          // meters run 0 to 100 (the value shown after the slash)

// --- Section C: the money personality badge (a star medal, revealed last) ---
const BADGE_LOCAL_X = 0.25;           // the badge sits in the lower middle, right of the meters
const BADGE_LOCAL_Y = -0.45;
const BADGE_DISC_RADIUS = 0.24;       // the round medal behind the star
const BADGE_DISC_DEPTH = 0.05;        // medal thickness
const BADGE_DISC_EMISSIVE = 0.35;     // a soft glow so the medal pops
const BADGE_STAR_OUTER = 0.13;        // the gold star on the medal (outer radius)
const BADGE_STAR_INNER = 0.055;       // star inner radius
const BADGE_STAR_POINTS = 5;          // a classic five point star
const BADGE_STAR_DEPTH = 0.03;        // how thick the star is
const BADGE_STAR_EMISSIVE = 0.6;      // the star glows like a prize
const BADGE_STAR_COLOR = MONEY_GOLD;  // a gold winner's star for every personality
const BADGE_CAPTION_TEXT = 'Your Money Personality';
const BADGE_CAPTION_GAP = 0.09;       // the caption floats above the medal
const BADGE_CAPTION_H = 0.07;         // caption chip world height
const BADGE_NAME_GAP = 0.1;           // the personality name sits below the medal
const BADGE_NAME_H = 0.1;             // name chip world height

// --- Animation and celebration feel for the reveals ---
const REPORT_BAR_GROW_TIME = 0.6;     // seconds for a bar or meter to grow into place
const REPORT_REVEAL_POP_TIME = 0.34;  // seconds for the badge to pop into view
const REPORT_WELCOME_BURST_LOCAL_Y = 0.55; // confetti for the welcome pops above the board center
const REPORT_BURST_Z_OFFSET = 0.12;   // confetti spawns this far in front of the board

// ============================================================
// VISUAL UPGRADE SCENE CONSTANTS
// A grounded, cozy "real room" look (a wood floor, painted walls with a
// wainscot and trim, a ceiling, a daylight window, a soft rug, and a few warm
// props), a friendly title screen, and a stage progress sign on the wall. Kept
// here as named knobs so the build code below never holds a raw number. None of
// these change any game value, scoring, or flow.
// ============================================================

// --- Grounded room palette (warm, friendly, easy on the eyes) ---
const FLOOR_WOOD_BASE = '#C79A66';     // warm oak plank
const FLOOR_WOOD_GRAIN = '#A6794B';    // darker grain lines and plank seams
const FLOOR_WOOD_LIGHT = '#D9B98C';    // soft plank highlight
const WALL_PAINT_COLOR = '#A9C5D9';    // calm dusty blue paint (upper wall)
const WALL_WAINSCOT_COLOR = '#F2EADC'; // warm white wainscot panel (lower wall)
const WALL_TRIM_COLOR = '#FBF6EC';     // bright trim (chair rail, baseboard, crown)
const CEILING_COLOR = '#FBF7F0';       // soft warm white ceiling
const RUG_COLOR = '#5C97C2';           // a soft blue play rug under the station
const RUG_BORDER_COLOR = '#F2EADC';    // cream rug border ring
const WINDOW_FRAME_COLOR = '#FBF6EC';  // white window frame, muntins, and sill
const WINDOW_SKY_TOP = '#8FCBF0';      // daylight blue at the top of the pane
const WINDOW_SKY_BOTTOM = '#EAF7FF';   // pale sky near the bottom of the pane
const WINDOW_LIGHT_COLOR = '#FFF3DC';  // warm daylight spilling in from the window
const WOOD_PROP_COLOR = '#B5854F';     // shelves and the re-skinned desk (warm wood)
const PLANT_POT_COLOR = '#E08A5B';     // terracotta pot (a warm clay accent)
const PLANT_LEAF_COLOR = '#4E9E63';    // friendly green leaves
const PLANT_LEAF_DARK = '#3C8150';     // a deeper green for leaf depth
const BOOK_COLORS = ['#E2604F', '#3FA0C9', '#E7B23C', '#5BAE6B', '#8E6FD0']; // cheerful book spines
const ART_FRAME_COLOR = '#B5854F';     // wood picture frame
const ART_PICTURE_COLOR = '#9FD2C0';   // a calm little landscape inside the frame

// --- Wall trim layout (a real room has a baseboard, a chair rail, and crown) ---
const WAINSCOT_HEIGHT = 1.0;           // how far up the wall the wainscot panel reaches
const TRIM_DEPTH = 0.04;               // how far the wainscot stands proud of the wall
const TRIM_INSET = 0.98;               // wainscot spans almost the full wall width
const CHAIR_RAIL_HEIGHT = 0.07;        // the chair rail strip that caps the wainscot
const CHAIR_RAIL_DEPTH = 0.07;         // the chair rail sticks out a little more than the panel
const BASEBOARD_HEIGHT = 0.16;         // baseboard strip at the floor
const BASEBOARD_DEPTH = 0.06;          // baseboard depth out from the wall
const CROWN_HEIGHT = 0.1;              // crown molding strip at the top of the wall
const CROWN_DEPTH = 0.06;              // crown depth out from the wall

// --- Floor and ceiling textures ---
const FLOOR_TEXTURE_PX = 512;          // wood floor texture resolution
const FLOOR_PLANK_REPEAT = 4;          // how many times the plank texture tiles across the room
const FLOOR_PLANK_ROWS = 6;            // plank rows drawn into one texture tile

// --- The daylight window (on the right wall) ---
const WINDOW_WIDTH = 1.3;              // window opening width
const WINDOW_HEIGHT = 1.4;             // window opening height
const WINDOW_CENTER_Y = 1.65;          // window center height
const WINDOW_CENTER_Z = -0.2;          // window center along the right wall (toward the front)
const WINDOW_FRAME_THICKNESS = 0.09;   // frame border thickness
const WINDOW_FRAME_DEPTH = 0.08;       // how far the frame stands off the wall
const WINDOW_SILL_DEPTH = 0.14;        // the little shelf under the window
const WINDOW_SILL_HEIGHT = 0.06;       // sill thickness
const WINDOW_LIGHT_INTENSITY = 0.5;    // soft daylight point light just inside the window
const WINDOW_LIGHT_DISTANCE = 7;       // how far the window light reaches

// --- The rug under the play area ---
const RUG_RADIUS = 1.55;               // outer (border) radius of the round rug
const RUG_INNER_RADIUS = 1.4;          // inner colored field radius
const RUG_CENTER_Z = -0.95;            // centered under the money station
const RUG_Y = 0.006;                   // a hair above the floor so it never z-fights

// --- The cozy bookshelf (on the left wall) ---
const SHELF_X = -2.86;                 // against the left wall inner face
const SHELF_Z = 0.55;                  // toward the front-left, clear of the desk
const SHELF_WIDTH = 0.9;               // shelf unit width (front to back along the wall)
const SHELF_DEPTH = 0.3;               // how far it reaches into the room
const SHELF_HEIGHT = 1.2;              // total height
const SHELF_BOARD_THICKNESS = 0.04;    // thickness of each shelf board
const SHELF_LEVELS = 3;                // number of book levels
const SHELF_BOOK_W = 0.05;             // one book spine width
const SHELF_BOOK_GAP = 0.012;          // gap between books

// --- The potted plant (back-right corner) ---
const PLANT_X = 2.45;
const PLANT_Z = -2.0;
const PLANT_POT_RADIUS = 0.17;
const PLANT_POT_HEIGHT = 0.34;
const PLANT_LEAF_COUNT = 7;            // how many leaf blades fan out of the pot
const PLANT_LEAF_HEIGHT = 0.5;         // how tall the leaves reach

// --- A small framed picture (on the left wall, above the shelf) ---
const ART_X = -2.88;
const ART_Y = 1.95;
const ART_Z = 0.55;
const ART_WIDTH = 0.7;
const ART_HEIGHT = 0.5;
const ART_FRAME_BORDER = 0.05;
const ART_DEPTH = 0.05;

// --- Lighting warmth (image-based ambient fill for grounded materials) ---
const IBL_SKY_COLOR = '#FFF4E2';       // warm light from above
const IBL_EQUATOR_COLOR = '#F2E9DA';   // gentle wraparound fill
const IBL_GROUND_COLOR = '#C9A981';    // warm bounce from the wood floor
const IBL_INTENSITY = 0.55;            // subtle, so it enriches without washing out

// ============================================================
// TITLE SCREEN AND PROGRESS HUD CONSTANTS (game-shell polish)
// A friendly start screen before onboarding, and a stage progress sign on the
// back wall that tracks which of the three life stages you are in. Text here is
// student-visible: 5th-grade reading level, second person, no dashes.
// ============================================================

// --- Title screen ---
const TITLE_TEXT = 'Money Moves';
const TITLE_TAGLINE = 'Make smart money choices and watch it grow!';
const TITLE_HINT = 'Point and click Play to begin.';
const TITLE_Z = -1.45;                 // in front of both viewers, ahead of the scoreboard
const TITLE_BANNER_Y = 2.0;            // big title near the top
const TITLE_BANNER_W = 2.2;            // banner width in meters
const TITLE_BANNER_H = 0.62;           // banner height in meters
const TITLE_TAGLINE_Y = 1.5;           // tagline below the title
const TITLE_TAGLINE_W = 2.1;
const TITLE_TAGLINE_H = 0.26;
const TITLE_HINT_Y = 0.72;             // a small hint below the Play button
const TITLE_HINT_W = 1.6;
const TITLE_HINT_H = 0.12;
const TITLE_PLAY_Y = 1.06;             // the chunky Play button
const TITLE_PLAY_W = 0.7;
const TITLE_PLAY_H = 0.26;
const TITLE_PLAY_D = 0.16;
const TITLE_CARD_W = 2.7;              // the title card behind everything (hides the wall board)
const TITLE_CARD_H = 2.25;
const TITLE_CARD_Y = 1.52;             // card center height (covers the board frame above)
const TITLE_CARD_COLOR = '#FBF1DD';   // warm cream card
const TITLE_CARD_FRAME = CORAL;       // a coral frame around the card
const TITLE_COIN_COUNT = 6;            // a few gold coins float around the title
const TITLE_COIN_RADIUS = 0.09;        // coin size
const TITLE_COIN_RING = 1.78;          // how far out the coins orbit the title (clear of the card)
const TITLE_COIN_RING_Y = 1.34;        // vertical radius of the coin ring (clears the card top and bottom)
const TITLE_COIN_BOB_AMP = 0.06;       // how far the coins bob
const TITLE_COIN_BOB_SPEED = 1.6;      // how quickly the coins bob
const TITLE_POP_TIME = 0.45;           // seconds for the title to pop in
const TITLE_BURST_COUNT = 18;          // celebration sparkles when you press Play

// --- Progress sign (the three life stages, on the back wall above the board) ---
const HUD_STAGE_LABELS = ['As a Kid', 'First Job', 'Grown Up'] as const;
const HUD_CHIP_W = 0.62;               // one stage chip width
const HUD_CHIP_H = 0.24;               // one stage chip height
const HUD_CHIP_D = 0.06;               // chip depth (a little chunky)
const HUD_CHIP_PITCH = 0.78;           // spacing between the three chips
const HUD_Y = 2.66;                    // up high, just above the scoreboard frame
const HUD_LABEL_H = 0.1;               // chip label world height
const HUD_CONNECTOR_H = 0.03;          // the little rail joining the chips
const HUD_ACTIVE_SCALE = 1.14;         // the current stage chip grows a little
const HUD_ACTIVE_EMISSIVE = 0.45;      // and glows so you can find it at a glance
const HUD_ACTIVE_COLOR = CORAL;        // the stage you are on (warm, lit)
const HUD_DONE_COLOR = GROWTH_GREEN;   // stages you have finished
const HUD_UPCOMING_COLOR = '#D7CDBC';  // stages still ahead (muted, in the background)
const HUD_REVEAL_TIME = 0.4;           // seconds for the sign to pop in when Stage 1 starts

// ============================================================
// GAME STATE - the live numbers that change as the student plays
// ============================================================
let game = {
  // --- Money buckets (the places the student's money can live) ---
  piggyBank: STARTING_MONEY,   // birthday money starts here
  savings: 0,                  // safe money that earns interest
  investedValue: 0,            // current worth of any active investments
  goalFund: 0,                 // money set aside for a big goal
  spentTotal: 0,               // money spent on wants (gone, kept for the summary)

  // --- Bookkeeping for scoring ---
  totalReceived: STARTING_MONEY, // everything the student has been given so far

  // --- The three meters (0 to 100) ---
  growthMeter: 0,
  securityMeter: 0,
  smartsMeter: 0,

  // --- Money Smarts tracking ---
  riskInfoViews: 0,            // times the student checked risk and reward first
  impulseMoves: 0,             // all-in bets or draining savings to zero
  matchedMoves: 0,             // smart moves that fit the moment

  // --- Player choices and progress ---
  avatar: null,                // which avatar the student picked (set later)
  stage: 0,                    // 0 setup, 1 to 3 the stages, 4 the summary
  week: 0,                     // which week of Stage 1 we are on

  // --- Snapshots for the summary chart ---
  moneyStartStage1: STARTING_MONEY,
  moneyStartStage2: 0,
  moneyStartStage3: 0,
  moneyEnd: 0,
};

// Adds up everything the student's money is currently worth.
function totalMoney() {
  return game.piggyBank + game.savings + game.investedValue + game.goalFund;
}

// ============================================================
// SCOREBOARD PAINTING
// updateScoreboard() refreshes the money total and the three meter fills from
// the game state. DashboardSystem (below) captures the panel's live document
// once it loads, stores it here, and calls updateScoreboard() the first time.
// ============================================================

let scoreboardDoc: UIKitDocument | undefined;

// Read one element from the scoreboard document by its id.
function boardText(id: string): UIKit.Text | undefined {
  return (scoreboardDoc?.getElementById(id) as UIKit.Text | null) ?? undefined;
}
function boardBox(id: string): UIKit.Container | undefined {
  return (scoreboardDoc?.getElementById(id) as UIKit.Container | null) ?? undefined;
}

// ---- Smooth scoreboard glide (Step 3.2) ----
// The money total and the meter fills count to their new values instead of
// snapping, so a gain or a meter bump reads as real feedback. This is the same
// counting approach the money round's animateCount helper uses (the Animator,
// easeInOutQuad, and COUNT_TIME from Step 1B), pointed at the UIKit scoreboard.

// The numbers the scoreboard is currently showing, so each change can count from
// there to the new value. Seeded with the starting state so the first paint snaps.
const boardShown = {
  money: totalMoney(),
  growth: game.growthMeter,
  security: game.securityMeter,
  smarts: game.smartsMeter,
};

type BoardKey = 'money' | 'growth' | 'security' | 'smarts';

// A throwaway object per value, used only as the Animator cancel key (just like
// animateCount uses the label mesh) so a fresh change cleanly replaces an earlier
// glide still running on the same value.
const boardGlideKeys: Record<BoardKey, Object3D> = {
  money: new Object3D(),
  growth: new Object3D(),
  security: new Object3D(),
  smarts: new Object3D(),
};

// Glide one scoreboard value from what is shown to its new number over COUNT_TIME,
// applying it each frame with `apply`. Snaps instantly when nothing changed.
function glideBoardValue(key: BoardKey, to: number, apply: (n: number) => void): void {
  Animator.cancelFor(boardGlideKeys[key]); // drop any earlier glide on this value
  const from = boardShown[key];
  boardShown[key] = to;
  if (from === to) {
    apply(to);
    return;
  }
  Animator.run(COUNT_TIME, (p) => apply(lerp(from, to, easeInOutQuad(p))), {
    target: boardGlideKeys[key],
    onComplete: () => apply(to),
  });
}

// Fill one meter bar and write its number, gliding both to the new value. The
// fill width is the track width scaled by the meter value, so 0 is empty and 100
// fills the whole track.
function paintMeter(key: 'growth' | 'security' | 'smarts', value: number): void {
  const v = Math.max(0, Math.min(100, value));
  glideBoardValue(key, v, (n) => {
    boardBox(`fill-${key}`)?.setProperties({ width: (METER_TRACK_WIDTH * n) / 100 });
    boardText(`val-${key}`)?.setProperties({ text: `${Math.round(n)}` });
  });
}

function updateScoreboard(): void {
  if (!scoreboardDoc) return;
  glideBoardValue('money', totalMoney(), (n) => {
    boardText('money-total')?.setProperties({ text: `$${Math.round(n)}` });
  });
  paintMeter('growth', game.growthMeter);
  paintMeter('security', game.securityMeter);
  paintMeter('smarts', game.smartsMeter);
}

// Watches for the scoreboard panel's document to load, grabs it, then paints
// the money total and meters once. Later steps call updateScoreboard() again
// whenever the money or a meter changes.
class DashboardSystem extends createSystem({
  board: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', SCOREBOARD_CONFIG)],
  },
}) {
  init(): void {
    this.cleanupFuncs.push(
      this.queries.board.subscribe(
        'qualify',
        (entity) => {
          scoreboardDoc = PanelDocument.data.document[entity.index] as
            | UIKitDocument
            | undefined;
          updateScoreboard();
        },
        true,
      ),
    );
  }
}

// Turn a palette hex string into the RGBA float array (0..1) the sky dome wants.
function rgba01(hex: string): [number, number, number, number] {
  const c = new Color(hex);
  return [c.r, c.g, c.b, 1];
}

// ============================================================
// MONEY ROUND - the cash station and the click-to-place interaction
//
// This whole section is self-contained: it builds its own little money
// station (a table, a cash tray, the jars, a readout, and a Done button),
// runs the interaction, and tears itself down when finished. It never touches
// the room or the scoreboard.
//
// CROSS-PLATFORM, NO PHYSICS: you CLICK a jar to send a bill flying into it,
// and click the "Take one out" button under a jar to send a bill back to the
// tray. Clicking uses the same pointer ray you set up in Foundation, so the
// laptop mouse and the headset controller behave the same. Bills are never
// grabbed or carried; they just animate from place to place.
// ============================================================

// ============================================================
// ANIMATION TOOLKIT
// A tiny set of reusable animations driven from the render loop, the same way
// the other Virginia Ventures sims animate things. Each animation is a closure
// that gets ticked every frame until it finishes. Stages and later steps reuse
// these for any springy motion, bill flight, or button bounce.
// ============================================================

interface Tween {
  elapsed: number;
  duration: number;
  target?: Object3D; // which object this drives, so a new action can cancel it
  onProgress: (p: number) => void; // p is raw progress, 0..1
  onComplete?: () => void;
}

// Linear blend between two numbers.
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Springy ease-out: rushes toward the end and overshoots a little before it
// settles, so motion feels bouncy instead of stiff.
function easeOutBack(t: number): number {
  const c1 = SPRING_OVERSHOOT;
  const c3 = c1 + 1;
  const u = t - 1;
  return 1 + c3 * u * u * u + c1 * u * u;
}

// Smooth start and stop, used for the flat (horizontal) part of a bill's flight.
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) * (-2 * t + 2)) / 2;
}

const Animator = {
  tweens: [] as Tween[],

  // The engine everything else is built on: run `onProgress` with raw 0..1
  // progress every frame for `duration` seconds, then call `onComplete` once.
  run(
    duration: number,
    onProgress: (p: number) => void,
    opts: { target?: Object3D; onComplete?: () => void } = {},
  ): void {
    this.tweens.push({
      elapsed: 0,
      duration: Math.max(0.0001, duration),
      target: opts.target,
      onProgress,
      onComplete: opts.onComplete,
    });
  },

  // Springy number tween: eases a value from start to end with a little
  // overshoot. Hand it any setter (a position component, an opacity, a width).
  value(
    start: number,
    end: number,
    duration: number,
    set: (v: number) => void,
    opts: { ease?: (t: number) => number; onComplete?: () => void } = {},
  ): void {
    const ease = opts.ease ?? easeOutBack;
    this.run(duration, (p) => set(lerp(start, end, ease(p))), {
      onComplete: opts.onComplete,
    });
  },

  // Bill arc: send an object from `from` to `to` along an up-and-over curve
  // (not a straight line) while it spins, over `duration` seconds.
  arc(
    object3D: Object3D,
    from: Vector3,
    to: Vector3,
    duration: number,
    opts: { arcHeight?: number; spinTurns?: number; onComplete?: () => void } = {},
  ): void {
    const arcHeight = opts.arcHeight ?? BILL_ARC_HEIGHT;
    const spin = (opts.spinTurns ?? BILL_SPIN_TURNS) * Math.PI * 2;
    this.run(
      duration,
      (p) => {
        const flat = easeInOutQuad(p);
        object3D.position.x = lerp(from.x, to.x, flat);
        object3D.position.z = lerp(from.z, to.z, flat);
        // A parabola that peaks halfway: the bill lifts up and arcs over.
        object3D.position.y = lerp(from.y, to.y, flat) + arcHeight * 4 * p * (1 - p);
        // Tumble as it flies; whole turns so it lands flat.
        object3D.rotation.x = spin * p;
        object3D.rotation.y = spin * 0.5 * p;
      },
      {
        target: object3D,
        onComplete: () => {
          object3D.position.copy(to);
          object3D.rotation.set(0, 0, 0); // settle flat, face up
          opts.onComplete?.();
        },
      },
    );
  },

  // Squash-and-bounce: quickly squish an object a little then pop it back with
  // a touch of overshoot. Used when a jar catches a bill or a button is pressed.
  squash(
    object3D: Object3D,
    opts: { amount?: number; duration?: number; onComplete?: () => void } = {},
  ): void {
    const amount = opts.amount ?? SQUASH_AMOUNT;
    const base = object3D.scale.x || 1; // remember the resting size to return to
    this.run(
      opts.duration ?? SQUASH_TIME,
      (p) => {
        // Squish down for the first third, then bounce back up with overshoot.
        const s =
          p < 0.35
            ? 1 - amount * (p / 0.35)
            : lerp(1 - amount, 1, easeOutBack((p - 0.35) / 0.65));
        const bulge = 1 + (1 - s) * 0.6; // widen as it shortens so it reads as squash
        object3D.scale.set(base * bulge, base * s, base * bulge);
      },
      { target: object3D, onComplete: () => object3D.scale.setScalar(base) },
    );
  },

  // Drop every animation driving this object, so a fresh action can take over.
  cancelFor(object3D: Object3D): void {
    this.tweens = this.tweens.filter((t) => t.target !== object3D);
  },

  // Forget every running animation (used when a round is torn down).
  clear(): void {
    this.tweens.length = 0;
  },

  // Advance every running animation by one frame.
  tick(delta: number): void {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i];
      tw.elapsed += delta;
      const p = Math.min(1, tw.elapsed / tw.duration);
      tw.onProgress(p);
      if (p >= 1) {
        this.tweens.splice(i, 1);
        tw.onComplete?.();
      }
    }
  },
};

// Ticks the animation toolkit once per frame from the render loop.
class AnimationSystem extends createSystem({}) {
  update(delta: number): void {
    Animator.tick(delta);
  }
}

// ============================================================
// PARTICLE BURSTS
// A handful of little gold sparkles that fly outward, arc up, then fall while
// fading out, built on the same Animator the rest of the round uses. Cheap and
// self-cleaning: each sparkle removes itself once its short life is over.
// Used for the small pop when a bill lands and the bigger celebration on a win.
// ============================================================

function spawnBurst(world: World, center: Vector3, count: number): void {
  // Most bursts are fired from inside a system update or a pointer handler (a
  // bill landing, pressing Done). Creating a transform entity mid-update does
  // not take effect, so we make the sparkles on a microtask: it runs the moment
  // the current frame's work finishes, which is a safe time to add entities.
  const cx = center.x;
  const cy = center.y;
  const cz = center.z;
  queueMicrotask(() => {
    for (let i = 0; i < count; i++) {
      const material = new MeshBasicMaterial({
        color: new Color(MONEY_GOLD),
        transparent: true,
        opacity: 1,
      });
      const mesh = new Mesh(new SphereGeometry(SPARKLE_RADIUS, 8, 8), material);
      mesh.position.set(cx, cy, cz);
      const entity = world.createTransformEntity(mesh, { persistent: true });

      // A random outward direction in the flat plane, plus an upward pop. Each
      // sparkle then falls under a gentle pretend gravity, like tossed confetti.
      const angle = Math.random() * Math.PI * 2;
      const speed = lerp(SPARKLE_SPEED_MIN, SPARKLE_SPEED_MAX, Math.random());
      const vx = Math.cos(angle) * speed;
      const vz = Math.sin(angle) * speed;
      const vy = lerp(SPARKLE_RISE_MIN, SPARKLE_RISE_MAX, Math.random());

      Animator.run(
        BURST_TIME,
        (p) => {
          const t = p * BURST_TIME;
          mesh.position.set(
            cx + vx * t,
            cy + vy * t - 0.5 * SPARKLE_GRAVITY * t * t,
            cz + vz * t,
          );
          material.opacity = 1 - p; // fade out across its short life
          mesh.scale.setScalar(1 - p * 0.5); // and shrink a little as it goes
        },
        {
          target: mesh,
          onComplete: () => {
            try {
              entity.dispose(); // dispose, not destroy, so the GPU memory is freed
            } catch {
              /* already gone */
            }
          },
        },
      );
    }
  });
}

// ============================================================
// FLOATING TEXT LABELS
// Small canvas-texture chips used for jar labels, the live readout, the
// instruction line, and temporary messages. The same lightweight approach the
// sibling sims use for one-off captions, so the round does not need its own UI
// panel. setText() redraws the chip in place when a number changes.
// ============================================================

interface Label {
  mesh: Mesh;
  setText: (text: string) => void;
}

// Draw a rounded chip with wrapped, auto-sized text onto a 2D canvas.
function paintLabelCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  text: string,
  bg: string,
  ink: string,
  bold: boolean,
  border?: string,
): void {
  ctx.clearRect(0, 0, w, h);
  const pad = h * 0.16;
  const radius = h * 0.28;
  // When a border is drawn, inset the rounded rect a little so the stroke is
  // not clipped at the canvas edge.
  const edge = border ? pad * 0.7 : pad * 0.4;
  const x = edge;
  const y = edge;
  const cw = w - edge * 2;
  const ch = h - edge * 2;
  const r = Math.min(radius, cw / 2, ch / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + cw, y, x + cw, y + ch, r);
  ctx.arcTo(x + cw, y + ch, x, y + ch, r);
  ctx.arcTo(x, y + ch, x, y, r);
  ctx.arcTo(x, y, x + cw, y, r);
  ctx.closePath();
  ctx.fillStyle = bg;
  ctx.fill();
  // A crisp outline gives bubbles and banners a finished, shipped-game look.
  if (border) {
    ctx.lineWidth = Math.max(2, h * 0.045);
    ctx.strokeStyle = border;
    ctx.stroke();
  }

  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const maxW = w - pad * 2;
  const maxH = h - pad * 2;
  // Shrink the font until the wrapped text fits the chip.
  let font = h * 0.42;
  let lines: string[] = [text];
  for (; font > 8; font -= 2) {
    ctx.font = `${bold ? 'bold ' : ''}${font}px system-ui, sans-serif`;
    lines = wrapText(ctx, text, maxW);
    if (lines.length * font * 1.18 <= maxH) break;
  }
  const lineH = font * 1.18;
  const startY = h / 2 - ((lines.length - 1) * lineH) / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], w / 2, startY + i * lineH);
  }
}

// Greedily wrap text into lines that each fit `maxW` pixels wide.
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxW) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Build a flat label that faces the player, with a setText() to update it.
function createLabel(
  text: string,
  opts: {
    canvasW?: number;
    canvasH?: number;
    height?: number;
    bg?: string;
    ink?: string;
    bold?: boolean;
    border?: string;
  } = {},
): Label {
  const canvasW = opts.canvasW ?? 512;
  const canvasH = opts.canvasH ?? 160;
  const bg = opts.bg ?? PANEL_CREAM;
  const ink = opts.ink ?? INK_DARK;
  const bold = opts.bold ?? true;
  const border = opts.border;
  const height = opts.height ?? LABEL_HEIGHT;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d')!;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace; // keep label colors true under tone mapping

  const draw = (str: string): void => {
    paintLabelCanvas(ctx, canvasW, canvasH, str, bg, ink, bold, border);
    texture.needsUpdate = true;
  };
  draw(text);

  const material = new MeshBasicMaterial({ map: texture, transparent: true, side: DoubleSide });
  const planeW = height * (canvasW / canvasH);
  const mesh = new Mesh(new PlaneGeometry(planeW, height), material);
  mesh.name = 'RoundLabel';
  return { mesh, setText: draw };
}

// ============================================================
// THE DOLLAR BILL
// The money the student picks up and places is cash: a bright cartoon dollar
// bill. Each bill is a thin green box with its value (like "$1" or "$20")
// printed on the top and bottom faces, drawn once per round onto a canvas
// texture and shared by every bill in that round.
// ============================================================

// Trace a rounded rectangle path (the same chunky toy look the labels use).
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Paint a friendly dollar bill face: a green field with a darker green border, a
// pale center panel, and the bill's value in bold so it reads against any jar.
function makeBillTexture(amountText: string): CanvasTexture {
  const w = BILL_CANVAS_W;
  const h = BILL_CANVAS_H;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = BILL_GREEN;
  ctx.fillRect(0, 0, w, h);
  // A darker rounded border just inside the edge.
  const m = h * 0.12;
  roundRect(ctx, m, m, w - m * 2, h - m * 2, h * 0.16);
  ctx.lineWidth = h * 0.06;
  ctx.strokeStyle = BILL_EDGE_GREEN;
  ctx.stroke();
  // A pale center panel so the amount stays readable inside any colored jar.
  const pm = h * 0.26;
  roundRect(ctx, pm, pm, w - pm * 2, h - pm * 2, h * 0.18);
  ctx.fillStyle = BILL_FACE_CREAM;
  ctx.fill();
  // The dollar amount, big and bold, centered on the panel.
  ctx.fillStyle = BILL_EDGE_GREEN;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(h * 0.5)}px system-ui, sans-serif`;
  ctx.fillText(amountText, w / 2, h * 0.54);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace; // keep the bill green true under tone mapping
  return texture;
}

// Six materials for a bill box: the printed face on top and bottom, a plain
// darker-green rim on the four thin edges. Box face order is +x,-x,+y,-y,+z,-z.
function makeBillMaterials(faceTexture: CanvasTexture): MeshStandardMaterial[] {
  const edge = new MeshStandardMaterial({
    color: new Color(BILL_EDGE_GREEN),
    roughness: SURFACE_ROUGHNESS,
  });
  const face = new MeshStandardMaterial({
    map: faceTexture,
    roughness: SURFACE_ROUGHNESS,
  });
  return [edge, edge, face, face, edge, edge];
}

// Glide a label's number from `from` to `to` over COUNT_TIME instead of snapping
// to it. The ease is monotonic (no springy overshoot), so a money amount never
// flashes past its real value on the way. Used only for the money round's own
// jar amounts and the "Money left to place" readout, never the scoreboard.
function animateCount(
  label: Label,
  from: number,
  to: number,
  format: (n: number) => string,
): void {
  Animator.cancelFor(label.mesh); // drop any earlier count still running on this label
  if (from === to) {
    label.setText(format(to));
    return;
  }
  Animator.run(
    COUNT_TIME,
    (p) => label.setText(format(Math.round(lerp(from, to, easeInOutQuad(p))))),
    { target: label.mesh, onComplete: () => label.setText(format(to)) },
  );
}

// ============================================================
// THE REUSABLE MONEY ROUND
// ============================================================

// One jar: where it is, how much is in it, the bills it holds, and its label.
interface RoundJar {
  index: number;
  key: string;
  group: Group;
  entity: Entity;
  centerX: number;
  centerZ: number;
  amount: number; // dollars currently inside
  billsIn: number; // how many bills are in it, counting any still mid-flight
  billStack: Entity[]; // the bills in this jar, newest last (take-back pops the top)
  amountLabel: Label;
  displayAmount: number; // the number the label is gliding toward (for counting-up)
}

// Something that gently glows while the pointer is over it (the jars and the
// take-back buttons). The system eases each one's glow toward its target.
interface HoverGlow {
  entity: Entity;
  mat: MeshStandardMaterial;
  glow: number;
}

// What the round hands back: how much money ended up in each container.
type RoundResult = Record<string, number>;

// One target container the student can place bills into.
interface RoundTarget {
  key: string;
  label: string;
  color: string;
  position: [number, number, number];
}

interface RoundConfig {
  money: number; // total dollars to place this round
  billValue: number; // dollars per bill (bill count = money / billValue)
  targets: RoundTarget[];
  practice: boolean; // when true, finishing clears the round and changes no real money
  instruction?: string; // the line shown near the tray
  onDone: (result: RoundResult) => void;
}

// Everything live about the round in progress.
interface ActiveRound {
  world: World; // the world this round was built in (sparkles need it to spawn)
  money: number;
  billValue: number;
  practice: boolean;
  onDone: (result: RoundResult) => void;
  jars: RoundJar[];
  billHomes: Map<number, Vector3>; // each bill's resting tray spot (fixed layout)
  trayBills: Entity[]; // bills still resting in the tray, ready to be placed
  billTexture?: CanvasTexture; // the shared bill face for this round, disposed on clear
  hoverGlowers: HoverGlow[]; // jars and buttons that glow when pointed at
  moneyLeft: number;
  displayMoneyLeft: number; // the number the readout is gliding toward (for counting-up)
  doneEnabled: boolean;
  doneMat: MeshStandardMaterial;
  readout: Label;
  entities: Entity[]; // everything to dispose when the round is cleared
}

// Only one money round runs at a time. The systems read this; the per-jar
// click handlers close over the specific round they were built for.
let activeRound: ActiveRound | undefined;

// Recompute how much money is still in the tray or in hand, refresh the
// readout, and enable the Done button only once everything is placed.
function updateMoneyLeft(round: ActiveRound): void {
  let placed = 0;
  for (const jar of round.jars) placed += jar.amount;
  round.moneyLeft = round.money - placed;
  // Glide the readout to its new value instead of snapping (Step 1B.5).
  const fromLeft = round.displayMoneyLeft;
  round.displayMoneyLeft = round.moneyLeft;
  animateCount(round.readout, fromLeft, round.moneyLeft, (n) => `Money left to place: $${n}`);
  const enabled = round.moneyLeft <= 0;
  if (enabled !== round.doneEnabled) {
    round.doneEnabled = enabled;
    round.doneMat.color.set(enabled ? CORAL : DONE_DISABLED_GRAY);
    round.doneMat.emissive.set(enabled ? CORAL : '#000000');
    round.doneMat.emissiveIntensity = enabled ? 0.25 : 0;
  }
}

// Click a jar: take the next bill from the tray and send it flying in. The
// amount updates right away so it feels responsive; the bill's arc and the
// little bounce when it lands are the visual payoff.
function addBillToJar(round: ActiveRound, jar: RoundJar): void {
  const bill = round.trayBills.pop();
  if (!bill) return; // every bill is already placed
  const obj = bill.object3D;
  if (!obj) {
    round.trayBills.push(bill);
    return;
  }
  Sound.click(); // a bill was picked up from the tray
  Animator.cancelFor(obj);
  const stack = jar.billsIn; // this bill's slot height inside the jar
  jar.billsIn += 1;
  jar.billStack.push(bill);
  jar.amount = jar.billsIn * round.billValue;
  // Glide the jar's amount up to its new value instead of snapping (Step 1B.5).
  const fromAmt = jar.displayAmount;
  jar.displayAmount = jar.amount;
  animateCount(jar.amountLabel, fromAmt, jar.amount, (n) => `$${n}`);
  updateMoneyLeft(round);
  const to = new Vector3(
    jar.centerX,
    MONEY_TABLE_Y + (stack + 1) * JAR_BILL_STACK_STEP,
    jar.centerZ,
  );
  Animator.arc(obj, obj.position.clone(), to, BILL_FLY_TIME, {
    onComplete: () => {
      Animator.squash(jar.group);
      Sound.cash(); // a soft cash sound as it lands in the jar
      spawnBurst(round.world, new Vector3(jar.centerX, JAR_BURST_Y, jar.centerZ), BURST_SMALL);
    },
  });
}

// Click a jar's take-back button: send the jar's most recent bill flying back
// to its tray spot. Nothing is ever lost.
function takeBillFromJar(round: ActiveRound, jar: RoundJar): void {
  const bill = jar.billStack.pop();
  if (!bill) return; // this jar is empty
  const obj = bill.object3D;
  if (!obj) {
    jar.billStack.push(bill);
    return;
  }
  Animator.cancelFor(obj);
  jar.billsIn = Math.max(0, jar.billsIn - 1);
  jar.amount = jar.billsIn * round.billValue;
  // Glide the jar's amount down to its new value instead of snapping (Step 1B.5).
  const fromAmt = jar.displayAmount;
  jar.displayAmount = jar.amount;
  animateCount(jar.amountLabel, fromAmt, jar.amount, (n) => `$${n}`);
  updateMoneyLeft(round);
  const home = round.billHomes.get(bill.index);
  const to = home ? home.clone() : obj.position.clone();
  Animator.arc(obj, obj.position.clone(), to, BILL_FLY_TIME, {
    onComplete: () => {
      round.trayBills.push(bill);
    },
  });
}

// Build the result, hand it to the caller, and (for a practice round) clear
// everything away with no change to real money.
function finishRound(round: ActiveRound): void {
  const result: RoundResult = {};
  for (const jar of round.jars) result[jar.key] = jar.amount;
  const onDone = round.onDone;
  const practice = round.practice;
  if (practice) clearRound(round);
  onDone(result);
}

// Dispose every entity the round created and forget it.
function clearRound(round: ActiveRound): void {
  Animator.clear();
  for (const entity of round.entities) {
    try {
      // Drop the pointer tag while the entity is still alive, so InputSystem
      // tears its listeners down cleanly before we free the GPU resources.
      if (entity.hasComponent(RayInteractable)) {
        entity.removeComponent(RayInteractable);
      }
      entity.dispose();
    } catch {
      /* already gone */
    }
  }
  round.entities.length = 0;
  // The bills in a round share one canvas texture; free it once they are gone.
  round.billTexture?.dispose();
  round.billTexture = undefined;
  if (activeRound === round) activeRound = undefined;
}

// A simple temporary caption that pops in, holds, then fades out and cleans up.
function showFloatingMessage(world: World, text: string): void {
  const label = createLabel(text, { canvasW: 900, canvasH: 200, height: 0.16 });
  const material = label.mesh.material as MeshBasicMaterial;
  material.transparent = true;
  const entity = world.createTransformEntity(label.mesh, { persistent: true });
  label.mesh.position.set(0, MESSAGE_Y, MONEY_TABLE_CENTER_Z + 0.2);
  Animator.run(
    MESSAGE_SHOW_TIME,
    (p) => {
      material.opacity = p < 0.15 ? p / 0.15 : p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1;
    },
    {
      onComplete: () => {
        try {
          entity.dispose();
        } catch {
          /* gone */
        }
      },
    },
  );
}

// Runs every frame while a round is active: eases the glow on whatever jar or
// take-back button the pointer is currently over, so it is clear what a click
// will act on.
class MoneyRoundSystem extends createSystem({}) {
  update(delta: number): void {
    const round = activeRound;
    if (!round) return;
    const glowF = Math.min(1, delta * JAR_GLOW_LERP);
    for (const glower of round.hoverGlowers) {
      const target = glower.entity.hasComponent(Hovered) ? JAR_HIGHLIGHT_EMISSIVE : 0;
      glower.glow += (target - glower.glow) * glowF;
      glower.mat.emissiveIntensity = glower.glow;
    }
  }
}

/**
 * Build and show one money round. Stages call this with their own jars; the
 * temporary test round below uses placeholder jars. The catching behavior is
 * always the same, so later steps only swap in nicer-looking jars.
 */
function showMoneyRound(world: World, config: RoundConfig): void {
  if (activeRound) clearRound(activeRound);

  const round: ActiveRound = {
    world,
    money: config.money,
    billValue: config.billValue,
    practice: config.practice,
    onDone: config.onDone,
    jars: [],
    billHomes: new Map(),
    moneyLeft: config.money,
    displayMoneyLeft: config.money,
    doneEnabled: false,
    // doneMat and readout are assigned as those pieces are built below.
    doneMat: new MeshStandardMaterial(),
    readout: createLabel(''),
    entities: [],
    trayBills: [],
    hoverGlowers: [],
  };
  activeRound = round;

  // ---- The money station table (the round's own furniture) ----
  const tableGroup = new Group();
  const topMat = new MeshStandardMaterial({ color: new Color(PANEL_CREAM), roughness: SURFACE_ROUGHNESS });
  const legMat = new MeshStandardMaterial({ color: new Color(CORAL), roughness: SURFACE_ROUGHNESS });
  const tableTop = new Mesh(
    new BoxGeometry(MONEY_TABLE_WIDTH, MONEY_TABLE_TOP_THICKNESS, MONEY_TABLE_DEPTH),
    topMat,
  );
  tableTop.position.y = MONEY_TABLE_Y - MONEY_TABLE_TOP_THICKNESS / 2;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  tableGroup.add(tableTop);
  const legH = MONEY_TABLE_Y - MONEY_TABLE_TOP_THICKNESS;
  const legX = MONEY_TABLE_WIDTH / 2 - MONEY_TABLE_LEG_RADIUS * 3;
  const legZ = MONEY_TABLE_DEPTH / 2 - MONEY_TABLE_LEG_RADIUS * 3;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    const leg = new Mesh(
      new CylinderGeometry(MONEY_TABLE_LEG_RADIUS, MONEY_TABLE_LEG_RADIUS, legH, 12),
      legMat,
    );
    leg.position.set(sx * legX, legH / 2, sz * legZ);
    leg.castShadow = true;
    tableGroup.add(leg);
  }
  tableGroup.position.set(0, 0, MONEY_TABLE_CENTER_Z);
  round.entities.push(world.createTransformEntity(tableGroup));

  // ---- The cash tray (a shallow coral dish with a low rim) ----
  const trayGroup = new Group();
  const trayMat = new MeshStandardMaterial({ color: new Color(CORAL), roughness: SURFACE_ROUGHNESS });
  const trayFloor = new Mesh(
    new BoxGeometry(TRAY_WIDTH, TRAY_FLOOR_THICKNESS, TRAY_DEPTH),
    trayMat,
  );
  trayFloor.position.y = MONEY_TABLE_Y + TRAY_FLOOR_THICKNESS / 2;
  trayFloor.receiveShadow = true;
  trayGroup.add(trayFloor);
  const rimH = 0.035;
  const rimT = 0.02;
  const rims: [number, number, number, number, number][] = [
    [0, (TRAY_DEPTH - rimT) / 2, TRAY_WIDTH, rimT, 0],
    [0, -(TRAY_DEPTH - rimT) / 2, TRAY_WIDTH, rimT, 0],
    [(TRAY_WIDTH - rimT) / 2, 0, rimT, TRAY_DEPTH, 0],
    [-(TRAY_WIDTH - rimT) / 2, 0, rimT, TRAY_DEPTH, 0],
  ];
  for (const [rx, rz, rw, rd] of rims) {
    const rim = new Mesh(new BoxGeometry(rw, rimH, rd), trayMat);
    rim.position.set(rx, MONEY_TABLE_Y + TRAY_FLOOR_THICKNESS + rimH / 2, rz);
    trayGroup.add(rim);
  }
  trayGroup.position.set(0, 0, TRAY_CENTER_Z);
  round.entities.push(world.createTransformEntity(trayGroup));

  // ---- The jars (click a jar to drop a bill in) ----
  config.targets.forEach((target, index) => {
    const jx = target.position[0];
    const jz = target.position[2];
    const group = new Group();
    const bodyMat = new MeshStandardMaterial({
      color: new Color(target.color),
      roughness: SURFACE_ROUGHNESS,
      emissive: new Color(target.color),
      emissiveIntensity: 0,
    });
    const body = new Mesh(
      new CylinderGeometry(JAR_RADIUS, JAR_RADIUS * 0.9, JAR_HEIGHT, 24),
      bodyMat,
    );
    body.position.y = JAR_HEIGHT / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    // A darker inner floor so dropped bills look like they sit down inside.
    const innerMat = new MeshStandardMaterial({ color: new Color(INK_DARK), roughness: 1 });
    const inner = new Mesh(new CylinderGeometry(JAR_RADIUS * 0.82, JAR_RADIUS * 0.82, 0.01, 20), innerMat);
    inner.position.y = JAR_HEIGHT * 0.18;
    group.add(inner);
    group.position.set(jx, MONEY_TABLE_Y, jz);
    // The jar itself is the click target for adding a bill; it glows on hover.
    const jarEntity = world.createTransformEntity(group).addComponent(RayInteractable);
    round.entities.push(jarEntity);
    round.hoverGlowers.push({ entity: jarEntity, mat: bodyMat, glow: 0 });

    // The jar's name and its live amount, floating above the mouth.
    const nameLabel = createLabel(target.label);
    nameLabel.mesh.position.set(jx, MONEY_TABLE_Y + JAR_HEIGHT + JAR_LABEL_GAP, jz);
    round.entities.push(world.createTransformEntity(nameLabel.mesh));
    const amountLabel = createLabel('$0', { bg: MONEY_GOLD });
    amountLabel.mesh.position.set(jx, MONEY_TABLE_Y + JAR_HEIGHT + JAR_AMOUNT_GAP, jz);
    round.entities.push(world.createTransformEntity(amountLabel.mesh));

    const jar: RoundJar = {
      index,
      key: target.key,
      group,
      entity: jarEntity,
      centerX: jx,
      centerZ: jz,
      amount: 0,
      billsIn: 0,
      billStack: [],
      amountLabel,
      displayAmount: 0,
    };
    round.jars.push(jar);

    // Click the jar to add a bill from the tray.
    (group as any).addEventListener('click', () => addBillToJar(round, jar));

    // A "Take one out" button standing on the table in front of the jar.
    const backMat = new MeshStandardMaterial({
      color: new Color(TAKEBACK_COLOR),
      roughness: SURFACE_ROUGHNESS,
      emissive: new Color(TAKEBACK_COLOR),
      emissiveIntensity: 0,
    });
    const backMesh = new Mesh(new BoxGeometry(TAKEBACK_W, TAKEBACK_H, TAKEBACK_D), backMat);
    backMesh.position.set(jx, MONEY_TABLE_Y + TAKEBACK_H / 2, jz + TAKEBACK_Z_OFFSET);
    backMesh.castShadow = true;
    const backLabel = createLabel('Take one out', { canvasW: 320, canvasH: 110, height: TAKEBACK_H * 0.62 });
    backLabel.mesh.position.set(0, 0, TAKEBACK_D / 2 + 0.003);
    backMesh.add(backLabel.mesh);
    const backEntity = world.createTransformEntity(backMesh).addComponent(RayInteractable);
    round.entities.push(backEntity);
    round.hoverGlowers.push({ entity: backEntity, mat: backMat, glow: 0 });
    (backMesh as any).addEventListener('pointerdown', () => {
      Animator.squash(backMesh);
      Sound.click(); // a button was pressed
    });
    (backMesh as any).addEventListener('click', () => takeBillFromJar(round, jar));
  });

  // ---- The bills, resting in the tray (animated props the jars pull from) ----
  const billCount = Math.max(0, Math.round(config.money / config.billValue));
  const rowCount = Math.max(1, Math.ceil(billCount / BILLS_PER_ROW));
  const billY = MONEY_TABLE_Y + TRAY_FLOOR_THICKNESS + BILL_REST_GAP + BILL_THICKNESS / 2;
  // Every bill in this round shows the same value, so they share one face texture.
  round.billTexture = makeBillTexture(`$${config.billValue}`);
  for (let i = 0; i < billCount; i++) {
    const row = Math.floor(i / BILLS_PER_ROW);
    const col = i % BILLS_PER_ROW;
    const colsThisRow = Math.min(BILLS_PER_ROW, billCount - row * BILLS_PER_ROW);
    const x = (col - (colsThisRow - 1) / 2) * BILL_SLOT_PITCH_X;
    const z = TRAY_CENTER_Z + ((rowCount - 1) / 2 - row) * BILL_SLOT_PITCH_Z;
    const billMesh = new Mesh(
      new BoxGeometry(BILL_WIDTH, BILL_THICKNESS, BILL_DEPTH),
      makeBillMaterials(round.billTexture),
    );
    billMesh.position.set(x, billY, z);
    billMesh.castShadow = true;
    // Bills are not clicked directly, so they need no Interactable or handlers;
    // a jar pulls the next one from the tray when you click it.
    const bill = world.createTransformEntity(billMesh);
    round.billHomes.set(bill.index, billMesh.position.clone());
    round.entities.push(bill);
    round.trayBills.push(bill);
  }

  // ---- The live "Money left to place" readout, above the tray ----
  const readout = createLabel('Money left to place: $0', { canvasW: 720, canvasH: 150, height: 0.11 });
  readout.mesh.position.set(0, ROUND_READOUT_Y, TRAY_CENTER_Z);
  round.readout = readout;
  round.entities.push(world.createTransformEntity(readout.mesh));

  // ---- The instruction line, floating above the station ----
  const instruction = createLabel(
    config.instruction ?? 'Click a jar to add a bill. Place all your bills, then press Done.',
    { canvasW: 1280, canvasH: 360, height: 0.34, bold: false },
  );
  instruction.mesh.position.set(0, ROUND_INSTRUCTION_Y, MONEY_TABLE_CENTER_Z);
  round.entities.push(world.createTransformEntity(instruction.mesh));

  // ---- The chunky 3D Done button (only works once nothing is left to place) ----
  const doneMat = new MeshStandardMaterial({ color: new Color(DONE_DISABLED_GRAY), roughness: SURFACE_ROUGHNESS });
  const doneMesh = new Mesh(new BoxGeometry(DONE_BUTTON_W, DONE_BUTTON_H, DONE_BUTTON_D), doneMat);
  doneMesh.position.set(DONE_BUTTON_X, MONEY_TABLE_Y + DONE_BUTTON_H / 2, DONE_BUTTON_Z);
  doneMesh.castShadow = true;
  const doneFace = createLabel('Done', { canvasW: 256, canvasH: 128, height: DONE_BUTTON_H * 0.7 });
  doneFace.mesh.position.set(0, 0, DONE_BUTTON_D / 2 + 0.003); // sits on the player-facing face
  doneMesh.add(doneFace.mesh);
  round.doneMat = doneMat;
  const doneEntity = world.createTransformEntity(doneMesh).addComponent(RayInteractable);
  round.entities.push(doneEntity);
  (doneMesh as any).addEventListener('pointerdown', () => {
    Animator.squash(doneMesh);
    Sound.click(); // the press itself is a soft click
  });
  (doneMesh as any).addEventListener('click', () => {
    if (!round.doneEnabled) return;
    Sound.chime(); // a happy chime for finishing
    const burstAt = new Vector3(0, DONE_BURST_Y, MONEY_TABLE_CENTER_Z);
    finishRound(round); // a practice round tears itself down here (clears the Animator)
    // Spawn the celebration AFTER teardown so its tweens survive the clear above.
    spawnBurst(round.world, burstAt, BURST_BIG);
  });

  // Set the readout text and the Done button's starting (disabled) look.
  updateMoneyLeft(round);
}

// ============================================================
// SOUND
// A small sound manager, the same fire-and-forget approach the other Virginia
// Ventures sims use (AudioUtils one-shots), plus one gentle looping music bed.
//
// IMPORTANT: a browser will not play any sound until the player's first click
// or trigger press. So we wait for that first interaction to resume the audio
// and start the music. Until then the scene is silent on purpose. This is the
// single most common audio mistake, so it is handled here once and for all.
// ============================================================

const Sound = {
  world: undefined as World | undefined,
  musicEntity: undefined as Entity | undefined,
  unlocked: false, // has the first interaction happened yet?
  muted: false, // is all sound currently turned off?

  // Build the (not yet playing) looping music bed and arm the first-interaction
  // unlock. The music plays only after the player clicks or presses a trigger.
  init(world: World): void {
    this.world = world;
    const music = world.createEntity();
    music.addComponent(AudioSource, {
      src: MUSIC_SRC,
      volume: MUSIC_VOLUME,
      loop: true,
      autoplay: false, // we start it on the first interaction, not on load
      positional: false, // an even bed all around, not tied to a spot
    });
    this.musicEntity = music;

    const unlock = () => this.unlock();
    // Laptop: any click or key press counts as the first interaction.
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    // Headset: the first controller trigger press counts.
    world.renderer.xr.addEventListener('sessionstart', () => {
      world.renderer.xr.getSession()?.addEventListener('selectstart', unlock);
    });
  },

  // Resume the shared Web Audio context (browsers start it suspended) and begin
  // the music. Safe to call many times; only the first call does any work.
  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    // getContext() hands back the very context the audio listener uses; cast to
    // the standard Web Audio type so we can read its state and resume it.
    const ctx = ThreeAudioContext.getContext() as unknown as AudioContext;
    if (ctx.state === 'suspended') void ctx.resume();
    if (this.musicEntity) {
      AudioUtils.setVolume(this.musicEntity, this.muted ? 0 : MUSIC_VOLUME);
      AudioUtils.play(this.musicEntity);
    }
  },

  // Turn all sound on or off. The music keeps looping but drops to silent volume
  // when muted (no restart), and one-shot effects below stay quiet while muted.
  // Returns the new muted state.
  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.musicEntity) {
      AudioUtils.setVolume(this.musicEntity, this.muted ? 0 : MUSIC_VOLUME);
    }
    return this.muted;
  },

  // Fire-and-forget one-shot effect; silent while muted.
  oneShot(src: string): void {
    if (this.muted || !this.world) return;
    AudioUtils.createOneShot(this.world, src, { volume: SFX_VOLUME, positional: false });
  },

  click(): void {
    this.oneShot(SFX_CLICK_SRC);
  },
  cash(): void {
    this.oneShot(SFX_CASH_SRC);
  },
  chime(): void {
    this.oneShot(SFX_CHIME_SRC);
  },
  blip(): void {
    this.oneShot(SFX_BLIP_SRC); // Penny's soft, friendly talking sound
  },
};

// ============================================================
// SPEAKER (MUTE) BUTTON
// A small standalone button standing in the room that turns all sound on and
// off. It is its own object, not part of the scoreboard or any round, so it
// stays put the whole time. It glows on hover like the round's buttons.
// ============================================================

// Glowers the room keeps lit on hover that live outside any round (just the
// speaker button for now). RoomFeedbackSystem eases these every frame.
const roomGlowers: HoverGlow[] = [];

function buildSpeakerButton(world: World): void {
  const group = new Group();

  // The little stand from the floor up to the button head.
  const postHeight = SPEAKER_Y - SPEAKER_H / 2;
  const postMat = new MeshStandardMaterial({ color: new Color(CORAL), roughness: SURFACE_ROUGHNESS });
  const post = new Mesh(
    new CylinderGeometry(SPEAKER_POST_RADIUS, SPEAKER_POST_RADIUS, postHeight, 12),
    postMat,
  );
  post.position.y = postHeight / 2;
  post.castShadow = true;
  group.add(post);

  // The button head: green when sound is on, muted gray when off.
  const headMat = new MeshStandardMaterial({
    color: new Color(SPEAKER_ON_COLOR),
    roughness: SURFACE_ROUGHNESS,
    emissive: new Color(SPEAKER_ON_COLOR),
    emissiveIntensity: 0,
  });
  const head = new Mesh(new BoxGeometry(SPEAKER_W, SPEAKER_H, SPEAKER_D), headMat);
  head.position.y = SPEAKER_Y;
  head.castShadow = true;
  group.add(head);

  // The label on the button face; it flips between on and off.
  const face = createLabel('Sound on', { canvasW: 320, canvasH: 150, height: SPEAKER_H * 0.62 });
  face.mesh.position.set(0, SPEAKER_Y, SPEAKER_D / 2 + 0.003);
  group.add(face.mesh);

  group.position.set(SPEAKER_X, 0, SPEAKER_Z);
  const entity = world
    .createTransformEntity(group, { persistent: true })
    .addComponent(RayInteractable);
  roomGlowers.push({ entity, mat: headMat, glow: 0 });

  (head as any).addEventListener('pointerdown', () => Animator.squash(head));
  (group as any).addEventListener('click', () => {
    const muted = Sound.toggleMute();
    face.setText(muted ? 'Sound off' : 'Sound on');
    headMat.color.set(muted ? SPEAKER_OFF_COLOR : SPEAKER_ON_COLOR);
    Sound.click(); // a soft tick on press (silent if we just muted, audible if we just turned it back on)
  });
}

// Eases the glow on any standalone room button (the speaker) the pointer is
// over, the same way the money round eases its jars and buttons.
class RoomFeedbackSystem extends createSystem({}) {
  update(delta: number): void {
    const glowF = Math.min(1, delta * JAR_GLOW_LERP);
    for (const glower of roomGlowers) {
      const target = glower.entity.hasComponent(Hovered) ? JAR_HIGHLIGHT_EMISSIVE : 0;
      glower.glow += (target - glower.glow) * glowF;
      glower.mat.emissiveIntensity = glower.glow;
    }
  }
}

// ============================================================
// ONBOARDING - Penny the guide and the setup flow (Step 2)
//
// Penny is a friendly gold coin who lives in the room and teaches the student.
// She talks through a reusable speech bubble (showGuideMessage), then walks the
// student through picking a look, learning the three meters and the three life
// stages, and a practice round with the real jars before Stage 1 begins.
//
// CROSS-PLATFORM, NO PHYSICS: every button here is a 3D mesh with RayInteractable
// and a click handler, the same pointer-ray pattern the money round uses, so the
// laptop mouse and the headset controller behave the same.
//
// ONE IMPORTANT GOTCHA (learned in Step 1B): world.createTransformEntity(...)
// silently does nothing when called straight from a click handler. So whenever a
// button advances the flow, we tear the old screen down right away (disposing is
// fine mid-handler) and then run the next step on a microtask, which is a safe
// time to create entities again.
// ============================================================

// Penny, built once and kept the whole time. GuideSystem bobs her every frame.
let penny: { group: Group; baseY: number } | undefined;

// The bouncy arrow Penny points at the scoreboard with, while a message is up.
let pointerArrow: { obj: Object3D; baseZ: number } | undefined;

// Buttons and characters that glow when the pointer is over them, for whatever
// onboarding screen is currently showing. Cleared and rebuilt each screen.
const guideGlowers: HoverGlow[] = [];

// Everything the current onboarding screen created (a speech bubble or the
// avatar pick), so we can dispose it cleanly before showing the next screen.
let onboardingScreen: Entity[] | undefined;

// The stage progress sign on the back wall (built once, persistent). GuideSystem
// watches game.stage and repaints it whenever the life stage changes.
let progressHud:
  | { group: Group; chips: { mat: MeshStandardMaterial; mesh: Mesh }[]; shown: number }
  | undefined;

// The wall scoreboard's visual parts (frame, bolts, live panel), so the title
// screen can hide the board for a clean welcome and reveal it when Play begins.
const boardParts: Object3D[] = [];
function setBoardVisible(visible: boolean): void {
  for (const part of boardParts) part.visible = visible;
}

// Tear down whatever onboarding screen is showing: drop its glow targets and
// the pointer arrow, then dispose its entities. Safe to call from a click
// handler (disposing works mid-handler; only creating entities does not).
function teardownScreen(): void {
  pointerArrow = undefined;
  guideGlowers.length = 0;
  if (onboardingScreen) {
    for (const entity of onboardingScreen) {
      try {
        if (entity.object3D) Animator.cancelFor(entity.object3D);
        if (entity.hasComponent(RayInteractable)) entity.removeComponent(RayInteractable);
        entity.dispose();
      } catch {
        /* already gone */
      }
    }
    onboardingScreen = undefined;
  }
}

// ---- Flat (laptop) pointer refresh ----
// On a laptop the pointer that turns mouse clicks into 3D hits only re-checks
// what it is aimed at when the mouse actually MOVES (IWSDK builds it that way).
// Every time Penny swaps one screen for the next, the old button is thrown away
// and a new one is built in the very same spot, so a player who clicks again
// without nudging the mouse is still aimed at the old (now gone) button and the
// click does nothing, until they happen to jiggle the mouse. That is why the
// Next button can take several clicks. The fix: remember where the mouse is, and
// feed the pointer a tiny do-nothing move right after a new screen appears so it
// re-aims at the fresh button on its own. The headset controller ray re-aims
// every frame already, so this is only needed on the laptop.
let flatPointerCanvas: HTMLCanvasElement | undefined;
let flatPointerSeen = false; // has the mouse moved at least once?
let flatPointerId = 1;
let flatPointerType = 'mouse';
let flatPointerX = 0;
let flatPointerY = 0;

// Remember the live mouse position (and its pointer id) so a synthetic move can
// be replayed at exactly the same spot. Call once at startup.
function trackFlatPointer(world: World): void {
  const canvas = world.renderer.domElement;
  flatPointerCanvas = canvas;
  const remember = (event: PointerEvent) => {
    flatPointerSeen = true;
    flatPointerId = event.pointerId;
    flatPointerType = event.pointerType || 'mouse';
    flatPointerX = event.clientX;
    flatPointerY = event.clientY;
  };
  // Capture phase so we read the true coordinates before anything reacts.
  canvas.addEventListener('pointermove', remember, { capture: true });
  canvas.addEventListener('pointerdown', remember, { capture: true });
}

// Re-aim the laptop pointer at the current mouse spot, so a button that was just
// built under the cursor becomes clickable without the player moving the mouse.
function refreshFlatPointer(world: World): void {
  // Skip in the headset (its ray re-aims every frame) and before the first move.
  if (world.session || !flatPointerSeen || !flatPointerCanvas) return;
  const canvas = flatPointerCanvas;
  const nudge = () =>
    canvas.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerId: flatPointerId, // same id so it updates the real pointer
        pointerType: flatPointerType,
        clientX: flatPointerX,
        clientY: flatPointerY,
        bubbles: true,
      }),
    );
  // Fire on the next two frames so the nudge lands after the new screen's button
  // has been registered for ray hits, whatever order the systems run in.
  requestAnimationFrame(() => {
    nudge();
    requestAnimationFrame(nudge);
  });
}

// Paint a simple smiley (two eyes, a smile, optional rosy cheeks) on a canvas,
// used for Penny's face and the avatar faces.
function paintSmiley(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cheeks: boolean,
): void {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const eyeR = w * 0.06;
  const eyeDX = w * 0.16;
  const eyeY = h * 0.42;
  ctx.fillStyle = PENNY_FACE_INK;
  ctx.beginPath();
  ctx.arc(cx - eyeDX, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + eyeDX, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();
  if (cheeks) {
    ctx.fillStyle = PENNY_CHEEK;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(cx - eyeDX * 1.35, eyeY + h * 0.12, w * 0.055, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + eyeDX * 1.35, eyeY + h * 0.12, w * 0.055, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = PENNY_FACE_INK;
  ctx.lineWidth = w * 0.045;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, h * 0.52, w * 0.2, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
}

// Build a flat smiley face plane that faces the player (used on Penny and avatars).
function makeSmileyFace(size: number, cheeks: boolean): Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  paintSmiley(ctx, 256, 256, cheeks);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({ map: texture, transparent: true, side: DoubleSide });
  return new Mesh(new PlaneGeometry(size, size), material);
}

// Stand Penny in the room. A gold coin turned to face you, with a smiley face on
// the front. GuideSystem gives her a gentle idle bob.
function buildPenny(world: World): void {
  const group = new Group();
  const bodyMat = new MeshStandardMaterial({
    color: new Color(MONEY_GOLD),
    roughness: 0.4,
    metalness: 0.25,
  });
  const body = new Mesh(
    new CylinderGeometry(PENNY_RADIUS, PENNY_RADIUS, PENNY_THICKNESS, 32),
    bodyMat,
  );
  body.rotation.x = Math.PI / 2; // lay the coin so its round face looks at you
  body.castShadow = true;
  group.add(body);

  const face = makeSmileyFace(PENNY_RADIUS * 1.5, true);
  face.position.set(0, 0, PENNY_THICKNESS / 2 + 0.002);
  group.add(face);

  group.position.set(PENNY_X, PENNY_Y, PENNY_Z);
  group.rotation.y = PENNY_TURN; // angle her toward you and the speech bubble
  world.createTransformEntity(group, { persistent: true });
  penny = { group, baseY: PENNY_Y };
}

// Show one of Penny's messages in a rounded speech bubble next to her, with a
// single button that advances to onNext. She bounces and plays a soft blip as
// the words appear. Reused for every message in onboarding and in the stages.
function showGuideMessage(
  world: World,
  text: string,
  onNext: () => void,
  opts: { buttonLabel?: string; pointAt?: 'meters' | 'money' } = {},
): void {
  teardownScreen();
  const entities: Entity[] = [];
  const buttonLabel = opts.buttonLabel ?? 'Next';

  // ---- The rounded cartoon speech bubble (with a little tail toward Penny) ----
  const bubbleGroup = new Group();
  const bubble = createLabel(text, {
    canvasW: GUIDE_BUBBLE_CANVAS_W,
    canvasH: GUIDE_BUBBLE_CANVAS_H,
    height: GUIDE_BUBBLE_H,
    bold: false,
    border: GUIDE_BUBBLE_BORDER,
  });
  bubbleGroup.add(bubble.mesh);
  const tailMat = new MeshBasicMaterial({ color: new Color(PANEL_CREAM), side: DoubleSide });
  const tail = new Mesh(new ConeGeometry(GUIDE_TAIL_SIZE, GUIDE_TAIL_SIZE * 1.4, 3), tailMat);
  tail.position.set(GUIDE_BUBBLE_W * 0.34, -GUIDE_BUBBLE_H * 0.42, 0.001);
  tail.rotation.z = -Math.PI * 0.62; // tip the little tail toward Penny
  bubbleGroup.add(tail);
  bubbleGroup.position.set(GUIDE_BUBBLE_X, GUIDE_BUBBLE_Y, GUIDE_BUBBLE_Z);
  const bubbleEntity = world.createTransformEntity(bubbleGroup);
  entities.push(bubbleEntity);

  // ---- The single advance button (Next / Got it / Start) ----
  const buttonMat = new MeshStandardMaterial({
    color: new Color(CORAL),
    roughness: SURFACE_ROUGHNESS,
    emissive: new Color(CORAL),
    emissiveIntensity: 0,
  });
  const buttonMesh = new Mesh(
    new BoxGeometry(GUIDE_BUTTON_W, GUIDE_BUTTON_H, GUIDE_BUTTON_D),
    buttonMat,
  );
  buttonMesh.position.set(GUIDE_BUBBLE_X, GUIDE_BUBBLE_Y - GUIDE_BUTTON_DROP, GUIDE_BUBBLE_Z);
  buttonMesh.castShadow = true;
  const buttonFace = createLabel(buttonLabel, {
    canvasW: 256,
    canvasH: 128,
    height: GUIDE_BUTTON_H * 0.55,
  });
  buttonFace.mesh.position.set(0, 0, GUIDE_BUTTON_D / 2 + 0.003);
  buttonMesh.add(buttonFace.mesh);
  const buttonEntity = world.createTransformEntity(buttonMesh).addComponent(RayInteractable);
  entities.push(buttonEntity);
  guideGlowers.push({ entity: buttonEntity, mat: buttonMat, glow: 0 });
  (buttonMesh as any).addEventListener('pointerdown', () => {
    Animator.squash(buttonMesh);
    Sound.click();
  });
  (buttonMesh as any).addEventListener('click', () => {
    teardownScreen();
    queueMicrotask(onNext); // create the next screen's entities off the click handler
  });

  // ---- The bouncy arrow Penny points at the scoreboard with, when asked ----
  if (opts.pointAt) {
    const py = opts.pointAt === 'money' ? POINTER_MONEY_Y : POINTER_METERS_Y;
    const arrowMat = new MeshStandardMaterial({
      color: new Color(POINTER_COLOR),
      roughness: SURFACE_ROUGHNESS,
      emissive: new Color(POINTER_COLOR),
      emissiveIntensity: POINTER_EMISSIVE,
    });
    const arrow = new Mesh(new ConeGeometry(POINTER_RADIUS, POINTER_HEIGHT, 16), arrowMat);
    arrow.rotation.x = -Math.PI / 2; // point the tip at the board (toward -z)
    arrow.position.set(0, py, POINTER_Z);
    const arrowEntity = world.createTransformEntity(arrow);
    entities.push(arrowEntity);
    pointerArrow = { obj: arrow, baseZ: POINTER_Z };
  }

  // ---- Penny reacts: a little bounce and a soft blip as she speaks ----
  if (penny) Animator.squash(penny.group);
  Sound.blip();

  // ---- Pop the bubble in so it feels alive ----
  bubbleGroup.scale.setScalar(0.01);
  Animator.run(
    GUIDE_POP_TIME,
    (p) => bubbleGroup.scale.setScalar(lerp(0.01, 1, easeOutBack(p))),
    { target: bubbleGroup },
  );

  onboardingScreen = entities;
  refreshFlatPointer(world); // re-aim the laptop pointer at the new button
}

// The avatar pick: four clearly-different characters on pedestals plus a
// Continue button that only works once a look is chosen. Picking one stores its
// name in game.avatar, grows it, and lights its pedestal.
function showAvatarPick(world: World, onContinue: () => void): void {
  teardownScreen();
  const entities: Entity[] = [];
  const groups: Group[] = [];
  const pedestalMats: MeshStandardMaterial[] = [];
  let continueEnabled = false;

  // ---- The Continue button, disabled (gray) until a look is picked ----
  const continueMat = new MeshStandardMaterial({
    color: new Color(DONE_DISABLED_GRAY),
    roughness: SURFACE_ROUGHNESS,
    emissive: new Color(CORAL),
    emissiveIntensity: 0,
  });
  const continueMesh = new Mesh(
    new BoxGeometry(AVATAR_CONTINUE_W, AVATAR_CONTINUE_H, AVATAR_CONTINUE_D),
    continueMat,
  );
  continueMesh.position.set(AVATAR_CONTINUE_X, AVATAR_CONTINUE_Y, AVATAR_CONTINUE_Z);
  continueMesh.castShadow = true;
  const continueFace = createLabel('Continue', {
    canvasW: 320,
    canvasH: 128,
    height: AVATAR_CONTINUE_H * 0.55,
  });
  continueFace.mesh.position.set(0, 0, AVATAR_CONTINUE_D / 2 + 0.003);
  continueMesh.add(continueFace.mesh);
  const continueEntity = world.createTransformEntity(continueMesh).addComponent(RayInteractable);
  entities.push(continueEntity);

  // Pick avatar i: store it, grow it, light its pedestal, dim the rest, and turn
  // the Continue button on the first time a look is chosen.
  const select = (i: number): void => {
    // The game object's avatar field is typed as null at rest; cast at the
    // assignment so we set it without touching the game state declaration.
    (game as { avatar: string | null }).avatar = AVATARS[i].name;
    for (let j = 0; j < groups.length; j++) {
      const target = j === i ? AVATAR_PICK_SCALE : 1;
      const start = groups[j].scale.x;
      Animator.cancelFor(groups[j]);
      Animator.run(
        SQUASH_TIME,
        (p) => groups[j].scale.setScalar(lerp(start, target, easeOutBack(p))),
        { target: groups[j] },
      );
      pedestalMats[j].emissiveIntensity = j === i ? AVATAR_HIGHLIGHT_EMISSIVE : 0;
    }
    if (!continueEnabled) {
      continueEnabled = true;
      continueMat.color.set(CORAL);
      continueMat.emissiveIntensity = 0.25; // a steady glow so it reads as ready
    }
    Sound.click();
  };

  // ---- The four characters ----
  AVATARS.forEach((av, i) => {
    const group = new Group();

    const pedMat = new MeshStandardMaterial({
      color: new Color(AVATAR_PEDESTAL_COLOR),
      roughness: SURFACE_ROUGHNESS,
      emissive: new Color(CORAL),
      emissiveIntensity: 0,
    });
    const pedestal = new Mesh(
      new CylinderGeometry(AVATAR_PEDESTAL_RADIUS, AVATAR_PEDESTAL_RADIUS, AVATAR_PEDESTAL_H, 24),
      pedMat,
    );
    pedestal.position.y = -AVATAR_BODY_RADIUS - AVATAR_PEDESTAL_H / 2;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    group.add(pedestal);

    const bodyMat = new MeshStandardMaterial({
      color: new Color(av.color),
      roughness: SURFACE_ROUGHNESS,
      emissive: new Color(av.color),
      emissiveIntensity: 0,
    });
    const body = new Mesh(new SphereGeometry(AVATAR_BODY_RADIUS, 24, 24), bodyMat);
    body.castShadow = true;
    group.add(body);

    const face = makeSmileyFace(AVATAR_BODY_RADIUS * 1.4, false);
    face.position.set(0, 0, AVATAR_BODY_RADIUS + 0.002);
    group.add(face);

    // A different little topper per character so they read as distinct, not just
    // recolored: a party hat, a cube, a bobble, and a cap.
    const topMat = new MeshStandardMaterial({ color: new Color(av.color), roughness: SURFACE_ROUGHNESS });
    let topper: Mesh;
    if (i === 0) {
      topper = new Mesh(new ConeGeometry(AVATAR_TOPPER_SIZE, AVATAR_TOPPER_SIZE * 1.6, 16), topMat);
    } else if (i === 1) {
      topper = new Mesh(
        new BoxGeometry(AVATAR_TOPPER_SIZE * 1.4, AVATAR_TOPPER_SIZE * 1.4, AVATAR_TOPPER_SIZE * 1.4),
        topMat,
      );
    } else if (i === 2) {
      topper = new Mesh(new SphereGeometry(AVATAR_TOPPER_SIZE, 16, 16), topMat);
    } else {
      topper = new Mesh(
        new CylinderGeometry(AVATAR_TOPPER_SIZE * 1.3, AVATAR_TOPPER_SIZE * 1.3, AVATAR_TOPPER_SIZE * 0.6, 20),
        topMat,
      );
    }
    topper.position.y = AVATAR_BODY_RADIUS + AVATAR_TOPPER_SIZE * 0.8;
    topper.castShadow = true;
    group.add(topper);

    const x = (i - (AVATARS.length - 1) / 2) * AVATAR_SPACING_X;
    group.position.set(x, AVATAR_Y, AVATAR_PANEL_Z);
    const entity = world.createTransformEntity(group).addComponent(RayInteractable);
    entities.push(entity);
    guideGlowers.push({ entity, mat: bodyMat, glow: 0 });
    groups.push(group);
    pedestalMats.push(pedMat);
    (group as any).addEventListener('click', () => select(i));
  });

  // Continue only fires once a look is picked.
  (continueMesh as any).addEventListener('pointerdown', () => {
    if (!continueEnabled) return;
    Animator.squash(continueMesh);
    Sound.click();
  });
  (continueMesh as any).addEventListener('click', () => {
    if (!continueEnabled) return;
    teardownScreen();
    queueMicrotask(onContinue);
  });

  onboardingScreen = entities;
  refreshFlatPointer(world); // re-aim the laptop pointer at the new buttons
}

// ---- Penny's exact onboarding words (5th grade, second person, no dashes) ----
const PENNY_GREETING =
  'Hi! I am Penny, and I will help you on your money journey. First, pick your look!';
const PENNY_AFTER_PICK = "Great, that is you! Let's get started.";
const PENNY_INTRO_1 =
  "You are going to make money choices at three times in your life. First you get an allowance. Then you get your first job. Then you make one big money choice. Let's see how your money grows.";
const PENNY_INTRO_2 =
  'See the three bars on the scoreboard? Financial Growth shows how much your money grows. Financial Security shows how safe your money is. Money Smarts shows if you think before you choose. They fill up as you play.';
const PENNY_INTRO_3 =
  'You start with $20 of birthday money. It is in your piggy bank right now. See the money total on the scoreboard? It says $20. That is all yours.';
const PENNY_PRACTICE_INTRO =
  "Before we start, let's practice moving your money. Point at a jar and click to drop a bill in. To take a bill back, click the button under that jar. This is just practice, so your real money is safe.";
const PENNY_READY =
  'Nice work! You know how to move your money now. Your real money journey starts now. Are you ready?';
const PRACTICE_ROUND_INSTRUCTION =
  'Point at a jar and click to add a bill. To take a bill back, click the button under that jar. Place all your bills, then press Done.';

// Kick off the whole setup flow: stand Penny up, then greet the student.
function startOnboarding(world: World): void {
  buildPenny(world);
  showGuideMessage(world, PENNY_GREETING, () =>
    showAvatarPick(world, () =>
      showGuideMessage(world, PENNY_AFTER_PICK, () => showIntro1(world)),
    ),
  );
}

// The three short intro messages, in order. Messages 2 and 3 point Penny's
// bouncy arrow at the meters and the money total on the scoreboard.
function showIntro1(world: World): void {
  showGuideMessage(world, PENNY_INTRO_1, () => showIntro2(world));
}
function showIntro2(world: World): void {
  showGuideMessage(world, PENNY_INTRO_2, () => showIntro3(world), { pointAt: 'meters' });
}
function showIntro3(world: World): void {
  showGuideMessage(world, PENNY_INTRO_3, () => showPracticeIntro(world), { pointAt: 'money' });
}

// Penny explains the practice, then the real pick-and-place tutorial runs with
// the actual jars. practice: true means no real money changes.
function showPracticeIntro(world: World): void {
  showGuideMessage(world, PENNY_PRACTICE_INTRO, () => runPracticeRound(world));
}
function runPracticeRound(world: World): void {
  showMoneyRound(world, {
    money: TUTORIAL_PRACTICE_MONEY,
    billValue: BILL_VALUE_TUTORIAL,
    targets: [
      { key: 'spend', label: 'Spend Now', color: SMARTS_VIOLET, position: [-JAR_ROW_SPACING_X, MONEY_TABLE_Y, JAR_CENTER_Z] },
      { key: 'piggy', label: 'Piggy Bank', color: SECURITY_BLUE, position: [0, MONEY_TABLE_Y, JAR_CENTER_Z] },
      { key: 'savings', label: 'Savings Account', color: GROWTH_GREEN, position: [JAR_ROW_SPACING_X, MONEY_TABLE_Y, JAR_CENTER_Z] },
    ],
    practice: true,
    instruction: PRACTICE_ROUND_INSTRUCTION,
    // onDone runs from inside the Done click handler, so hop to a microtask
    // before building Penny's next bubble.
    onDone: () => queueMicrotask(() => showReady(world)),
  });
}

// The ready hand-off: Penny asks if you are ready, and Start begins Stage 1.
function showReady(world: World): void {
  showGuideMessage(
    world,
    PENNY_READY,
    () => {
      game.stage = 1;
      startStage1(world);
    },
    { buttonLabel: 'Start' },
  );
}

// STAGE 1: ALLOWANCE AND SAVING. Build the three money places and Max, then play
// the real Stage 1 situations (see the Stage 1 section below) instead of the old
// engine test. The scene is built once; the scenario list runs from s1_intro.
function startStage1(world: World): void {
  buildStage1Scene(world);
  interestExplainedYet = false;          // fresh stage: no interest lesson given yet
  riskViewsBeforeCard = game.riskInfoViews; // baseline so we know if the card's info was opened
  runScenarios(world, stage1Scenarios(world));
}

// Bobs Penny gently, bobs the scoreboard pointer arrow while it is up, and eases
// the glow on whatever onboarding button or character the pointer is over.
class GuideSystem extends createSystem({}) {
  private elapsed = 0;

  update(delta: number): void {
    this.elapsed += delta;
    // Keep the wall progress sign in step with the current life stage. This only
    // reads game.stage (set by the stages themselves) and repaints on a change,
    // so it tracks progress without touching any game logic or flow.
    if (progressHud && progressHud.shown !== game.stage) updateProgressHud(game.stage);
    if (penny) {
      const wobble = Math.sin(this.elapsed * PENNY_BOB_SPEED);
      penny.group.position.y = penny.baseY + wobble * PENNY_BOB_AMP;
      penny.group.rotation.z = wobble * PENNY_SWAY;
    }
    if (pointerArrow) {
      pointerArrow.obj.position.z =
        pointerArrow.baseZ - Math.sin(this.elapsed * POINTER_BOB_SPEED) * POINTER_BOB_AMP;
    }
    const glowF = Math.min(1, delta * JAR_GLOW_LERP);
    for (const glower of guideGlowers) {
      const target = glower.entity.hasComponent(Hovered) ? JAR_HIGHLIGHT_EMISSIVE : 0;
      glower.glow += (target - glower.glow) * glowF;
      glower.mat.emissiveIntensity = glower.glow;
    }
  }
}

// ============================================================
// THE SCENARIO ENGINE (Step 3)
//
// The game is scenario based: each stage is a list of small life situations.
// Penny sets a situation up, you make one decision (sort some bills, or pick an
// option), and a consequence plays out. This section builds the reusable pieces
// the stages are made of: helpers that apply consequences, a choice presenter,
// and a runner that plays a stage as a plain list of situations.
//
// CROSS-PLATFORM, NO PHYSICS: the choice buttons are 3D meshes with
// RayInteractable and click handlers, the same pointer-ray pattern the rest of
// the app uses, so the laptop mouse and the headset controller behave the same.
// The microtask gotcha from Step 1B applies here too: a button tears its screen
// down right away (disposing is fine mid-handler) and runs the next step on a
// microtask, which is a safe time to create entities again. The choice screen
// reuses onboarding's teardownScreen() and the GuideSystem hover glow.
// ============================================================

// ---- Consequence helpers (Step 3.2) ----
// The stages call these to change a meter. Each keeps the meter between 0 and 100
// and then refreshes the (now animated) scoreboard. Money is changed by the
// stages setting the money buckets directly, then calling updateScoreboard().

function clampMeter(value: number): number {
  return Math.max(0, Math.min(100, value));
}
function addGrowth(points: number): void {
  game.growthMeter = clampMeter(game.growthMeter + points);
  updateScoreboard();
}
function addSecurity(points: number): void {
  game.securityMeter = clampMeter(game.securityMeter + points);
  updateScoreboard();
}
function addSmarts(points: number): void {
  game.smartsMeter = clampMeter(game.smartsMeter + points);
  updateScoreboard();
}

// ---- The choice presenter (Step 3.1) ----

interface ChoiceOption {
  label: string; // the words on the button, like "Buy it"
  value: string; // what the choice hands back, like "buy"
}

interface ChoiceConfig {
  prompt: string; // the decision question
  options: ChoiceOption[]; // the chunky cartoon buttons to pick from
  info?: string; // optional risk and reward text, shown on request
  onPick: (value: string) => void; // called with the chosen option's value
}

// Show a yes-or-no style decision: the question on a card, one chunky button per
// option, and an optional "See the risk and reward" button that reveals the info
// text. Picking an option hands its value back through onPick. Reused by every
// stage. Lives in the same screen lifecycle as Penny's messages, so the existing
// teardownScreen() and GuideSystem hover glow handle cleanup and highlighting.
function showChoice(world: World, config: ChoiceConfig): void {
  teardownScreen();
  const entities: Entity[] = [];

  // ---- The decision question, on a floating card above the buttons ----
  const promptCard = createLabel(config.prompt, {
    canvasW: CHOICE_PROMPT_CANVAS_W,
    canvasH: CHOICE_PROMPT_CANVAS_H,
    height: CHOICE_PROMPT_H,
    bold: true,
  });
  promptCard.mesh.position.set(0, CHOICE_PROMPT_Y, CHOICE_CENTER_Z);
  entities.push(world.createTransformEntity(promptCard.mesh));
  // Pop the card in so the choice feels alive (nothing else squashes it).
  promptCard.mesh.scale.setScalar(0.01);
  Animator.run(
    CHOICE_POP_TIME,
    (p) => promptCard.mesh.scale.setScalar(lerp(0.01, 1, easeOutBack(p))),
    { target: promptCard.mesh },
  );

  // ---- One chunky cartoon button per option, in a centered row ----
  const count = config.options.length;
  const pitch = CHOICE_BUTTON_W + CHOICE_BUTTON_GAP;
  config.options.forEach((option, i) => {
    const x = (i - (count - 1) / 2) * pitch;
    const mat = new MeshStandardMaterial({
      color: new Color(CHOICE_BUTTON_COLOR),
      roughness: SURFACE_ROUGHNESS,
      emissive: new Color(CHOICE_BUTTON_COLOR),
      emissiveIntensity: 0,
    });
    const mesh = new Mesh(
      new BoxGeometry(CHOICE_BUTTON_W, CHOICE_BUTTON_H, CHOICE_BUTTON_D),
      mat,
    );
    mesh.position.set(x, CHOICE_BUTTON_Y, CHOICE_CENTER_Z);
    mesh.castShadow = true;
    const face = createLabel(option.label, {
      canvasW: 360,
      canvasH: 150,
      height: CHOICE_BUTTON_H * 0.5,
    });
    face.mesh.position.set(0, 0, CHOICE_BUTTON_D / 2 + 0.003);
    mesh.add(face.mesh);
    const entity = world.createTransformEntity(mesh).addComponent(RayInteractable);
    entities.push(entity);
    guideGlowers.push({ entity, mat, glow: 0 }); // glow on hover via GuideSystem
    (mesh as any).addEventListener('pointerdown', () => {
      Animator.squash(mesh);
      Sound.click(); // the soft click when an option is pressed
    });
    (mesh as any).addEventListener('click', () => {
      teardownScreen();
      queueMicrotask(() => config.onPick(option.value));
    });
  });

  // ---- The optional "See the risk and reward" button and its info card ----
  if (config.info) {
    // Build the info card now but keep it hidden. Creating an entity from inside
    // a click handler silently no-ops, so the handler only flips this one on.
    const infoCard = createLabel(config.info, {
      canvasW: INFO_PANEL_CANVAS_W,
      canvasH: INFO_PANEL_CANVAS_H,
      height: INFO_PANEL_H,
      bold: false,
    });
    infoCard.mesh.position.set(INFO_PANEL_X, INFO_PANEL_Y, CHOICE_CENTER_Z);
    infoCard.mesh.visible = false;
    entities.push(world.createTransformEntity(infoCard.mesh));

    const infoMat = new MeshStandardMaterial({
      color: new Color(INFO_BUTTON_COLOR),
      roughness: SURFACE_ROUGHNESS,
      emissive: new Color(INFO_BUTTON_COLOR),
      emissiveIntensity: 0,
    });
    const infoMesh = new Mesh(
      new BoxGeometry(INFO_BUTTON_W, INFO_BUTTON_H, INFO_BUTTON_D),
      infoMat,
    );
    infoMesh.position.set(0, INFO_BUTTON_Y, CHOICE_CENTER_Z);
    infoMesh.castShadow = true;
    const infoFace = createLabel(INFO_BUTTON_LABEL, {
      canvasW: 640,
      canvasH: 128,
      height: INFO_BUTTON_H * 0.5,
    });
    infoFace.mesh.position.set(0, 0, INFO_BUTTON_D / 2 + 0.003);
    infoMesh.add(infoFace.mesh);
    const infoEntity = world
      .createTransformEntity(infoMesh)
      .addComponent(RayInteractable);
    entities.push(infoEntity);
    guideGlowers.push({ entity: infoEntity, mat: infoMat, glow: 0 });

    let infoCounted = false; // only the first peek in this choice is rewarded
    (infoMesh as any).addEventListener('pointerdown', () => {
      Animator.squash(infoMesh);
      Sound.click();
    });
    (infoMesh as any).addEventListener('click', () => {
      if (!infoCard.mesh.visible) {
        infoCard.mesh.visible = true;
        infoCard.mesh.scale.setScalar(0.01);
        Animator.run(
          CHOICE_POP_TIME,
          (p) => infoCard.mesh.scale.setScalar(lerp(0.01, 1, easeOutBack(p))),
          { target: infoCard.mesh },
        );
      }
      if (!infoCounted) {
        infoCounted = true;
        game.riskInfoViews += 1; // looking before leaping is rewarded later
      }
    });
  }

  // ---- Penny presents the choice: a little bounce and a soft blip ----
  if (penny) Animator.squash(penny.group);
  Sound.blip();

  onboardingScreen = entities;
  refreshFlatPointer(world); // re-aim the laptop pointer at the new buttons
}

// ---- The scenario runner (Step 3.3) ----

interface ChoiceDecision {
  type: 'choice';
  prompt: string;
  options: ChoiceOption[];
  info?: string;
}
interface AllocateDecision {
  type: 'allocate';
  money: number; // total dollars to place
  billValue: number; // dollars per bill
  jars: RoundTarget[]; // the containers to sort the bills into
}
type ScenarioDecision = ChoiceDecision | AllocateDecision;

// What the decision handed back: a choice value, the money-round result (jar ->
// dollars), or undefined for a message-only beat with no decision.
type ScenarioResult = string | RoundResult | undefined;

// What onResult returns. penny: Penny's outcome line, or null for none. next: a
// scenario id jumps there, null stops the sequence, and leaving it off continues
// to the next situation in the list.
interface ScenarioOutcome {
  penny: string | null;
  next?: string | null;
}

interface Scenario {
  id: string;
  setup: string; // what Penny says to set the situation up
  decision?: ScenarioDecision; // the one decision, or none for a message beat
  onResult?: (result: ScenarioResult) => ScenarioOutcome | void; // apply consequences
}

// Play a stage as a list of situations. For each one: Penny sets it up, the
// student makes its one decision (a choice or a money round), onResult applies
// the consequences and returns Penny's outcome line and where to go next, Penny
// says that line, and the runner moves on. Most situations just continue to the
// next in the list; a choice can branch by returning a scenario id, and those
// branches are short detours that rejoin the main path. Stops at the list end.
function runScenarios(world: World, list: Scenario[]): void {
  const byId = new Map<string, Scenario>();
  for (const scenario of list) byId.set(scenario.id, scenario);

  // Step 1: Penny sets the situation up, then we run its decision.
  function play(scenario: Scenario): void {
    showGuideMessage(world, scenario.setup, () => runDecision(scenario));
  }

  // Step 2: run the one decision (or skip straight to the result for a beat).
  function runDecision(scenario: Scenario): void {
    const decision = scenario.decision;
    if (!decision) {
      resolve(scenario, undefined); // a message-only beat: nothing to decide
      return;
    }
    if (decision.type === 'choice') {
      showChoice(world, {
        prompt: decision.prompt,
        options: decision.options,
        info: decision.info,
        onPick: (value) => resolve(scenario, value),
      });
    } else {
      // A real money round (not practice), so the placement sticks. The runner
      // tears the station down before applying the result and moving on.
      showMoneyRound(world, {
        money: decision.money,
        billValue: decision.billValue,
        targets: decision.jars,
        practice: false,
        onDone: (result) => {
          if (activeRound) clearRound(activeRound);
          queueMicrotask(() => resolve(scenario, result));
        },
      });
    }
  }

  // Steps 3 to 5: apply consequences, let Penny react, then advance.
  function resolve(scenario: Scenario, result: ScenarioResult): void {
    const outcome = scenario.onResult ? scenario.onResult(result) : undefined;
    const next = outcome?.next; // undefined: next in list. null: stop. id: jump.

    const advance = (): void => {
      let nextScenario: Scenario | undefined;
      if (next === undefined) {
        nextScenario = list[list.indexOf(scenario) + 1];
      } else if (next !== null) {
        nextScenario = byId.get(next);
      }
      if (nextScenario) play(nextScenario); // else the sequence ends here
    };

    if (outcome && outcome.penny) {
      showGuideMessage(world, outcome.penny, advance);
    } else {
      advance(); // a beat with no outcome line just moves on
    }
  }

  if (list.length > 0) play(list[0]);
}

// ============================================================
// STAGE 1: ALLOWANCE AND SAVING (Step 4)
//
// The three allowance weeks plus the rare-card choice. Penny's exact words are
// kept in named constants below (5th grade, second person, no dashes). The
// spoken amounts $10 and $15 match ALLOWANCE_PER_WEEK and FRIEND_OFFER_PRICE; if
// those constants change, update the spoken lines here too.
// ============================================================

// ---- Penny's exact Stage 1 words ----
const PENNY_S1_INTRO =
  "Welcome to your childhood! Every Saturday you get a $10 allowance. You can spend it on something you want, keep it safe in your piggy bank, or put it in your savings account, which grows a little every week. Let's go!";
const PENNY_S1_WEEK1 =
  'It is Saturday! Here is your $10 allowance. How do you want to split it?';
const PENNY_S1_WEEK2 =
  'Another Saturday, another $10 allowance. Split it however you like.';
const PENNY_S1_WEEK3 =
  'Here is your last allowance as a kid, $10. Where does it go?';
const PENNY_S1_INTEREST_FIRST =
  'Look! Your savings account grew on its own. That extra money is called interest. Money you save makes more money over time.';
const PENNY_S1_INTEREST_AGAIN = 'Your savings grew a little more this week.';
const PENNY_S1_SAVED_NOTHING =
  'You spent it all this week. That is okay, but money in savings is how it grows.';
const PENNY_S1_CARD_SETUP =
  'Look, your friend Max ran up! He is selling a rare holo card for $15. Do you want it?';
const PENNY_S1_CARD_PROMPT = 'Buy the rare card for $15, or pass?';
const PENNY_S1_CARD_INFO =
  'If you buy it, $15 comes out of your savings, or your piggy bank if your savings is low. The card is rare and cool, but the money is gone. If you pass, you keep your money.';
const PENNY_S1_BOUGHT_LOW =
  'You got the card! It is super cool. But you used up most of your money, so be careful.';
const PENNY_S1_BOUGHT_OK = 'You got the card and still have money saved. Nice balance!';
const PENNY_S1_PASSED =
  'You passed on the card and kept your money. That takes willpower!';
const PENNY_S1_CARD_BOUGHT = 'That card is one of a kind. Now, back to growing up.';
const PENNY_S1_CARD_PASSED =
  'Saving up is a real skill. Your money is still here, ready to grow.';

// The three places the allowance is sorted into. These are passed to
// showMoneyRound, which builds the labeled jars at these spots; the toy store,
// piggy bank, and savings bank landmarks (buildStage1Scene) stand just behind.
const STAGE1_TARGETS: RoundTarget[] = [
  { key: 'spend', label: 'Spend Now', color: SMARTS_VIOLET, position: [-JAR_ROW_SPACING_X, MONEY_TABLE_Y, JAR_CENTER_Z] },
  { key: 'piggy', label: 'Piggy Bank', color: SECURITY_BLUE, position: [0, MONEY_TABLE_Y, JAR_CENTER_Z] },
  { key: 'savings', label: 'Savings Account', color: GROWTH_GREEN, position: [JAR_ROW_SPACING_X, MONEY_TABLE_Y, JAR_CENTER_Z] },
];

// ---- Stage 1 live state (reset at the start of the stage) ----
let stage1SceneBuilt = false;          // build the places and Max only once
let interestExplainedYet = false;      // has Penny taught what interest is yet
let riskViewsBeforeCard = 0;           // riskInfoViews before the card, to tell if its info was opened
let maxState: { group: Group; revealed: boolean } | undefined; // Max, prebuilt and hidden

// ---- Building the three places and Max ----

// A simple lit, shadow-casting prop part in the bright cartoon style.
function litProp(geometry: BufferGeometry, color: string): Mesh {
  const mesh = new Mesh(
    geometry,
    new MeshStandardMaterial({ color: new Color(color), roughness: SURFACE_ROUGHNESS }),
  );
  mesh.castShadow = true;
  return mesh;
}

// The toy store (Spend Now): a little shelf unit with bright toys on it.
function buildToyStore(world: World, x: number): void {
  const g = new Group();
  for (const s of [-1, 1]) {
    const side = litProp(new BoxGeometry(0.04, STORE_HEIGHT, STORE_DEPTH), STORE_COLOR);
    side.position.set((s * STORE_WIDTH) / 2, STORE_HEIGHT / 2, 0);
    g.add(side);
  }
  const back = litProp(new BoxGeometry(STORE_WIDTH, STORE_HEIGHT, 0.03), STORE_COLOR);
  back.position.set(0, STORE_HEIGHT / 2, -STORE_DEPTH / 2 + 0.015);
  g.add(back);
  const shelfYs = [0.06, STORE_HEIGHT * 0.45, STORE_HEIGHT - 0.06];
  for (const sy of shelfYs) {
    const shelf = litProp(new BoxGeometry(STORE_WIDTH, STORE_SHELF_THICKNESS, STORE_DEPTH), STORE_COLOR);
    shelf.position.set(0, sy, 0);
    g.add(shelf);
  }
  // A handful of little toys on the lower two shelves so it reads as a toy store.
  [shelfYs[0], shelfYs[1]].forEach((sy, row) => {
    for (let i = 0; i < 2; i++) {
      const n = row * 2 + i;
      const color = STORE_TOY_COLORS[n % STORE_TOY_COLORS.length];
      let toy: Mesh;
      if (n % 3 === 0) toy = litProp(new SphereGeometry(STORE_TOY_SIZE, 16, 16), color);
      else if (n % 3 === 1)
        toy = litProp(new BoxGeometry(STORE_TOY_SIZE * 1.6, STORE_TOY_SIZE * 1.6, STORE_TOY_SIZE * 1.6), color);
      else toy = litProp(new ConeGeometry(STORE_TOY_SIZE, STORE_TOY_SIZE * 1.8, 16), color);
      toy.position.set((i - 0.5) * STORE_WIDTH * 0.45, sy + STORE_SHELF_THICKNESS / 2 + STORE_TOY_SIZE, STORE_DEPTH * 0.05);
      g.add(toy);
    }
  });
  g.position.set(x, 0, PLACE_Z);
  world.createTransformEntity(g, { persistent: true });
}

// The piggy bank: a chunky pink piggy on a little stand.
function buildPiggyBank(world: World, x: number): void {
  const g = new Group();
  const stand = litProp(
    new CylinderGeometry(PIGGY_STAND_RADIUS, PIGGY_STAND_RADIUS * 1.15, PIGGY_STAND_HEIGHT, 20),
    PIGGY_STAND_COLOR,
  );
  stand.position.set(0, PIGGY_STAND_HEIGHT / 2, 0);
  g.add(stand);
  const bodyY = PIGGY_STAND_HEIGHT + PIGGY_BODY_RADIUS * 0.85;
  const body = litProp(new SphereGeometry(PIGGY_BODY_RADIUS, 24, 24), PIGGY_PINK);
  body.scale.set(1.35, 1, 1); // a wider oval body
  body.position.set(0, bodyY, 0);
  g.add(body);
  const snout = litProp(
    new CylinderGeometry(PIGGY_BODY_RADIUS * 0.3, PIGGY_BODY_RADIUS * 0.3, 0.05, 16),
    PIGGY_SNOUT_COLOR,
  );
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, bodyY, PIGGY_BODY_RADIUS * 0.95);
  g.add(snout);
  for (const s of [-1, 1]) {
    const ear = litProp(new ConeGeometry(PIGGY_BODY_RADIUS * 0.22, PIGGY_BODY_RADIUS * 0.4, 12), PIGGY_PINK);
    ear.position.set(s * PIGGY_BODY_RADIUS * 0.5, bodyY + PIGGY_BODY_RADIUS * 0.7, PIGGY_BODY_RADIUS * 0.3);
    g.add(ear);
    const eye = litProp(new SphereGeometry(PIGGY_BODY_RADIUS * 0.09, 10, 10), INK_DARK);
    eye.position.set(s * PIGGY_BODY_RADIUS * 0.32, bodyY + PIGGY_BODY_RADIUS * 0.2, PIGGY_BODY_RADIUS * 0.78);
    g.add(eye);
  }
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const leg = litProp(
        new CylinderGeometry(PIGGY_BODY_RADIUS * 0.16, PIGGY_BODY_RADIUS * 0.16, PIGGY_BODY_RADIUS * 0.5, 10),
        PIGGY_SNOUT_COLOR,
      );
      leg.position.set(sx * PIGGY_BODY_RADIUS * 0.7, bodyY - PIGGY_BODY_RADIUS * 0.85, sz * PIGGY_BODY_RADIUS * 0.45);
      g.add(leg);
    }
  const slot = litProp(new BoxGeometry(PIGGY_BODY_RADIUS * 0.5, 0.012, PIGGY_BODY_RADIUS * 0.16), PIGGY_SLOT_COLOR);
  slot.position.set(0, bodyY + PIGGY_BODY_RADIUS * 0.98, 0);
  g.add(slot);
  g.position.set(x, 0, PLACE_Z);
  world.createTransformEntity(g, { persistent: true });
}

// The savings bank: a little vault building with a round gold door.
function buildSavingsBank(world: World, x: number): void {
  const g = new Group();
  const base = litProp(new BoxGeometry(BANK_WIDTH + 0.08, BANK_STAND_HEIGHT, BANK_DEPTH + 0.08), PANEL_CREAM);
  base.position.set(0, BANK_STAND_HEIGHT / 2, 0);
  g.add(base);
  const bodyY = BANK_STAND_HEIGHT + BANK_BODY_HEIGHT / 2;
  const body = litProp(new BoxGeometry(BANK_WIDTH, BANK_BODY_HEIGHT, BANK_DEPTH), BANK_COLOR);
  body.position.set(0, bodyY, 0);
  g.add(body);
  for (const s of [-1, 1]) {
    const col = litProp(
      new CylinderGeometry(BANK_COLUMN_RADIUS, BANK_COLUMN_RADIUS, BANK_BODY_HEIGHT * 0.8, 12),
      PANEL_CREAM,
    );
    col.position.set(s * BANK_WIDTH * 0.36, bodyY, BANK_DEPTH / 2 + 0.005);
    g.add(col);
  }
  const roof = litProp(new ConeGeometry(BANK_WIDTH * 0.78, BANK_ROOF_HEIGHT, 4), BANK_ROOF_COLOR);
  roof.rotation.y = Math.PI / 4; // square the pyramid to the building
  roof.position.set(0, BANK_STAND_HEIGHT + BANK_BODY_HEIGHT + BANK_ROOF_HEIGHT / 2, 0);
  g.add(roof);
  const door = litProp(new CylinderGeometry(BANK_DOOR_RADIUS, BANK_DOOR_RADIUS, 0.03, 24), BANK_DOOR_COLOR);
  door.rotation.x = Math.PI / 2;
  door.position.set(0, bodyY - BANK_BODY_HEIGHT * 0.05, BANK_DEPTH / 2 + 0.02);
  g.add(door);
  const handle = litProp(new SphereGeometry(BANK_DOOR_RADIUS * 0.18, 12, 12), INK_DARK);
  handle.position.set(0, bodyY - BANK_BODY_HEIGHT * 0.05, BANK_DEPTH / 2 + 0.045);
  g.add(handle);
  g.position.set(x, 0, PLACE_Z);
  world.createTransformEntity(g, { persistent: true });
}

// Max, the friendly kid who runs in with a shiny rare card. Built hidden; the
// card situation reveals him with a run-in, and the branch beats hide him again.
function buildMax(world: World): void {
  const g = new Group();
  for (const s of [-1, 1]) {
    const leg = litProp(
      new CylinderGeometry(MAX_BODY_RADIUS * 0.32, MAX_BODY_RADIUS * 0.32, MAX_LEG_HEIGHT, 12),
      MAX_LEG_COLOR,
    );
    leg.position.set(s * MAX_BODY_RADIUS * 0.45, MAX_LEG_HEIGHT / 2, 0);
    g.add(leg);
  }
  const bodyY = MAX_LEG_HEIGHT + MAX_BODY_RADIUS;
  const body = litProp(new SphereGeometry(MAX_BODY_RADIUS, 24, 24), MAX_BODY_COLOR);
  body.position.set(0, bodyY, 0);
  g.add(body);
  const headY = MAX_LEG_HEIGHT + MAX_BODY_RADIUS * 2 + MAX_HEAD_RADIUS * 0.55;
  const head = litProp(new SphereGeometry(MAX_HEAD_RADIUS, 24, 24), MAX_HEAD_COLOR);
  head.position.set(0, headY, 0);
  g.add(head);
  const hair = litProp(
    new SphereGeometry(MAX_HEAD_RADIUS * 1.02, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    MAX_HAIR_COLOR,
  );
  hair.position.set(0, headY + MAX_HEAD_RADIUS * 0.12, 0);
  g.add(hair);
  const face = makeSmileyFace(MAX_HEAD_RADIUS * 1.4, true); // friendly face toward the player
  face.position.set(0, headY, MAX_HEAD_RADIUS + 0.002);
  g.add(face);
  const arm = litProp(
    new CylinderGeometry(MAX_BODY_RADIUS * 0.18, MAX_BODY_RADIUS * 0.18, MAX_BODY_RADIUS * 1.3, 10),
    MAX_BODY_COLOR,
  );
  arm.position.set(MAX_BODY_RADIUS * 0.9, bodyY + MAX_BODY_RADIUS * 0.4, MAX_BODY_RADIUS * 0.5);
  arm.rotation.z = Math.PI / 4;
  g.add(arm);
  const card = new Mesh(
    new BoxGeometry(MAX_CARD_W, MAX_CARD_H, MAX_CARD_THICKNESS),
    new MeshStandardMaterial({
      color: new Color(MAX_CARD_COLOR),
      roughness: 0.25,
      metalness: 0.3,
      emissive: new Color(MAX_CARD_COLOR),
      emissiveIntensity: MAX_CARD_EMISSIVE,
    }),
  );
  card.castShadow = true;
  card.position.set(MAX_BODY_RADIUS * 1.35, bodyY + MAX_BODY_RADIUS * 1.0, MAX_BODY_RADIUS * 0.85);
  card.rotation.set(0, -0.2, 0.15);
  g.add(card);
  g.position.set(MAX_REST_X, 0, MAX_Z);
  g.visible = false; // hidden until the card situation
  world.createTransformEntity(g, { persistent: true });
  maxState = { group: g, revealed: false };
}

// Build the three money places and Max once, the first time Stage 1 starts.
function buildStage1Scene(world: World): void {
  if (stage1SceneBuilt) return;
  stage1SceneBuilt = true;
  buildToyStore(world, -PLACE_SPACING_X); // Spend Now, on the left (behind the violet jar)
  buildPiggyBank(world, 0); // Piggy Bank, center (behind the blue jar)
  buildSavingsBank(world, PLACE_SPACING_X); // Savings Account, on the right (behind the green jar)
  buildMax(world);
}

// Max runs in from the right with a little bounce, then settles with a squash.
function revealMax(): void {
  if (!maxState || maxState.revealed) return;
  maxState.revealed = true;
  const g = maxState.group;
  g.visible = true;
  g.position.set(MAX_START_X, 0, MAX_Z);
  Sound.blip();
  Animator.cancelFor(g);
  Animator.run(
    MAX_WALK_TIME,
    (p) => {
      g.position.x = lerp(MAX_START_X, MAX_REST_X, easeInOutQuad(p));
      g.position.y = Math.abs(Math.sin(p * Math.PI * 3)) * MAX_RUN_BOUNCE;
    },
    {
      target: g,
      onComplete: () => {
        g.position.set(MAX_REST_X, 0, MAX_Z);
        Animator.squash(g);
      },
    },
  );
}

// Max heads off once the card deal is done.
function hideMax(): void {
  if (!maxState) return;
  Animator.cancelFor(maxState.group);
  maxState.group.visible = false;
  maxState.group.position.set(MAX_REST_X, 0, MAX_Z);
  maxState.revealed = false;
}

// ---- Stage 1 consequence helpers ----

// Penny's end-of-childhood line, built from how the stage actually went. The
// total matches the scoreboard, which rounds to whole dollars.
function stage1SummaryLine(): string {
  const total = Math.round(totalMoney());
  const lead =
    game.savings > game.spentTotal
      ? `Awesome work in your childhood! You saved well and your money grew. You have $${total} now.`
      : `You had fun with your money as a kid! You have $${total} now. As you grow up, try saving a bit more to watch it grow.`;
  return `${lead} Time to grow up and get your first job!`;
}

// Apply one allowance week: bank the split, reward saving, add interest, and
// return Penny's outcome line. Shared by all three weeks (they differ only in
// Penny's setup line).
function applyAllowanceWeek(result: ScenarioResult): ScenarioOutcome {
  const split = (result ?? {}) as RoundResult;
  const spend = split.spend ?? 0;
  const piggy = split.piggy ?? 0;
  const savings = split.savings ?? 0;

  game.spentTotal += spend;
  game.piggyBank += piggy;
  game.savings += savings;
  game.totalReceived += ALLOWANCE_PER_WEEK;

  // Putting any money in savings this week is a little Growth and Security win.
  if (savings > 0) {
    addGrowth(SAVE_BONUS);
    addSecurity(SAVE_BONUS);
  }

  // Savings grows on its own: everything saved so far earns interest.
  const earnedInterest = game.savings > 0;
  if (earnedInterest) {
    game.savings += game.savings * SAVINGS_INTEREST_RATE;
    addGrowth(INTEREST_BONUS);
  }
  updateScoreboard(); // the money total changed even if no meter did

  if (earnedInterest && !interestExplainedYet) {
    interestExplainedYet = true;
    return { penny: PENNY_S1_INTEREST_FIRST };
  }
  if (earnedInterest) return { penny: PENNY_S1_INTEREST_AGAIN };
  return { penny: PENNY_S1_SAVED_NOTHING };
}

// Build the Stage 1 situation list. onResult closures capture `world` so the
// wrap can hand off to Stage 2.
function stage1Scenarios(world: World): Scenario[] {
  const weekDecision: AllocateDecision = {
    type: 'allocate',
    money: ALLOWANCE_PER_WEEK,
    billValue: BILL_VALUE_STAGE1,
    jars: STAGE1_TARGETS,
  };

  const s1Wrap: Scenario = {
    // Refreshed as the last allowance week resolves (the runner shows a
    // scenario's setup before its onResult runs, so the summary is prepared
    // there); seeded here so it is never empty.
    id: 's1_wrap',
    setup: stage1SummaryLine(),
    onResult: () => {
      // Reward keeping a safety cushion through childhood, snapshot the money for
      // the summary chart, then hand off to Stage 2.
      if (game.piggyBank + game.savings >= BUFFER_THRESHOLD) addSecurity(BUFFER_BONUS);
      game.moneyStartStage2 = totalMoney();
      game.stage = 2;
      startStage2(world);
      return { penny: null, next: null };
    },
  };

  const s1Intro: Scenario = { id: 's1_intro', setup: PENNY_S1_INTRO };

  const s1Week1: Scenario = {
    id: 's1_week1',
    setup: PENNY_S1_WEEK1,
    decision: weekDecision,
    onResult: (result) => {
      const out = applyAllowanceWeek(result);
      revealMax(); // Max runs in so he is on stage when the card opens next
      return out;
    },
  };

  const s1Card: Scenario = {
    id: 's1_card',
    setup: PENNY_S1_CARD_SETUP,
    decision: {
      type: 'choice',
      prompt: PENNY_S1_CARD_PROMPT,
      options: [
        { label: 'Buy it', value: 'buy' },
        { label: 'Pass', value: 'pass' },
      ],
      info: PENNY_S1_CARD_INFO,
    },
    onResult: (result) => {
      // Looking before you leap is a Money Smarts win.
      if (game.riskInfoViews > riskViewsBeforeCard) addSmarts(VIEWED_INFO_BONUS);
      if (result === 'buy') {
        // Pay $15 from savings first, then the piggy bank for any remainder.
        let owed = FRIEND_OFFER_PRICE;
        const fromSavings = Math.min(game.savings, owed);
        game.savings -= fromSavings;
        owed -= fromSavings;
        const fromPiggy = Math.min(game.piggyBank, owed);
        game.piggyBank -= fromPiggy;
        owed -= fromPiggy;
        game.spentTotal += FRIEND_OFFER_PRICE;
        updateScoreboard();
        if (game.piggyBank + game.savings < BUFFER_THRESHOLD) {
          addSmarts(-IMPULSE_PENALTY); // an impulse buy that drained the cushion
          return { penny: PENNY_S1_BOUGHT_LOW, next: 's1_card_bought' };
        }
        return { penny: PENNY_S1_BOUGHT_OK, next: 's1_card_bought' };
      }
      return { penny: PENNY_S1_PASSED, next: 's1_card_passed' };
    },
  };

  const s1CardBought: Scenario = {
    id: 's1_card_bought',
    setup: PENNY_S1_CARD_BOUGHT,
    onResult: () => {
      hideMax();
      return { penny: null, next: 's1_week2' };
    },
  };

  const s1CardPassed: Scenario = {
    id: 's1_card_passed',
    setup: PENNY_S1_CARD_PASSED,
    onResult: () => {
      hideMax();
      return { penny: null, next: 's1_week2' };
    },
  };

  const s1Week2: Scenario = {
    id: 's1_week2',
    setup: PENNY_S1_WEEK2,
    decision: weekDecision,
    onResult: (result) => applyAllowanceWeek(result),
  };

  const s1Week3: Scenario = {
    id: 's1_week3',
    setup: PENNY_S1_WEEK3,
    decision: weekDecision,
    onResult: (result) => {
      const out = applyAllowanceWeek(result);
      s1Wrap.setup = stage1SummaryLine(); // prepare the wrap line now (see s1Wrap)
      return out;
    },
  };

  // Order: intro, week 1, the card and its two short beats, then weeks 2 and 3,
  // then the wrap. The card branches to one beat, both rejoin at s1_week2.
  return [s1Intro, s1Week1, s1Card, s1CardBought, s1CardPassed, s1Week2, s1Week3, s1Wrap];
}

// ============================================================
// STAGE 2: FIRST JOB AND INVESTING (Step 5)
//
// Your first paycheck arrives, you split it between spending and savings, and
// then you can try something new: investing some of your money in Max's food
// truck. A market roll decides whether the truck is a hit or has a slow month,
// and your invested money grows or shrinks to match. Penny's exact words live in
// named constants below (5th grade, second person, no dashes). The spoken $100
// matches STAGE2_STARTING_FUNDS; if that constant changes, the lines follow it.
//
// ENGINE NOTE (same as Stage 1's wrap): runScenarios shows a scenario's setup
// BEFORE its onResult runs, so any message whose words depend on a roll or a
// total is prepared in the PREVIOUS beat's onResult and stored on the later
// scenario's setup. So s2_invest.onResult rolls the market and writes
// s2_market.setup, and s2_market.onResult does the end-of-stage bookkeeping and
// writes s2_wrap.setup. This keeps each beat a single bubble with no invented
// text and the truck/money changes synced to the line that describes them.
// ============================================================

// ---- Penny's exact Stage 2 words ----
const PENNY_S2_INTRO =
  `You grew up and got your first job! Here is your first paycheck, $${STAGE2_STARTING_FUNDS}. You are older now, so your money goes to spending or to your savings account. This stage, you can also try something new: investing your money to help it grow.`;
const PENNY_S2_PAYCHECK =
  `Payday! Here is your $${STAGE2_STARTING_FUNDS} paycheck. How much do you want to spend, and how much do you want to save?`;
const PENNY_S2_PAYCHECK_SAVED =
  'Nice, you set a lot aside. Saved money can be put to work.';
const PENNY_S2_PAYCHECK_SPENT =
  'You enjoyed your paycheck! Just remember, saved money is what lets you invest and grow.';
const PENNY_S2_INVEST_SETUP =
  'Remember your friend Max? He is starting a food truck! He needs money to buy supplies and asks if you want to invest. When you invest, you put money into a business. If it does well, you get more money back. If it does not, you get less. Do you want to invest some of your savings?';
const PENNY_S2_INVEST_PROMPT = 'Do you want to invest some of your savings?';
const PENNY_S2_INVEST_INFO =
  'Max\'s food truck does well about half the time. If it does well, your money grows a lot. If it has a slow month, you get back less than you put in. Investing can grow your money, but it has risk.';
const PENNY_S2_CANT_AFFORD =
  'You do not have enough saved to invest right now. Investing takes money you can set aside. Saving some next time gives you that chance.';
const PENNY_S2_KEEP_SAFE = 'You decided to keep your money safe for now.';
const PENNY_S2_MARKET_NO_INVEST =
  'Max\'s food truck opened without you. It did just okay. You kept your money safe, which is fine. Investing is one way to help money grow when you are ready.';
const PENNY_S2_WRAP_INVESTED =
  'You tried investing, which is a big step. Whether it grew or not, you learned how it works.';
const PENNY_S2_WRAP_SAFE =
  'You played it safe this time. When you are ready, investing can help your money grow.';
const PENNY_S2_WRAP_NEXT =
  'Next up, the biggest money decisions yet, where you will learn to spread your money in smart ways.';

// The two paycheck targets: the Spend Now store and the Savings account, reused
// from Stage 1 and lined up with their landmarks. The piggy bank stays in the
// room but is not a target this stage, because you are older now.
const STAGE2_TARGETS: RoundTarget[] = [
  { key: 'spend', label: 'Spend Now', color: SMARTS_VIOLET, position: [-JAR_ROW_SPACING_X, MONEY_TABLE_Y, JAR_CENTER_Z] },
  { key: 'savings', label: 'Savings Account', color: GROWTH_GREEN, position: [JAR_ROW_SPACING_X, MONEY_TABLE_Y, JAR_CENTER_Z] },
];

// ---- Stage 2 live state (reset at the start of the stage) ----
let stage2SceneBuilt = false;          // build the food truck only once
let foodTruck: { busy: Group; quiet: Group } | undefined; // the two switchable looks
let investedThisStage = false;         // did the student invest at all this stage
let riskViewsBeforeInvest = 0;         // riskInfoViews before the invest choice, to tell if its info was opened

// ---- Building Max's food truck ----

// A cartoon food truck with two looks the market event switches between: a BUSY
// look (a glowing Open sign and a short line of customers) for a hit, and a QUIET
// look (a grey wash and a Slow day sign, no customers) for a slow month. It
// starts neutral (both looks hidden). Built persistent, once.
function buildFoodTruck(world: World): void {
  const g = new Group();

  // Two chunky wheels peeking out on the player-facing side.
  for (const s of [-1, 1]) {
    const wheel = litProp(
      new CylinderGeometry(TRUCK_WHEEL_RADIUS, TRUCK_WHEEL_RADIUS, 0.12, 18),
      TRUCK_WHEEL_COLOR,
    );
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(s * TRUCK_BODY_W * 0.32, TRUCK_WHEEL_RADIUS, TRUCK_BODY_D / 2 - 0.04);
    g.add(wheel);
  }

  // The box body and a little driver cab at one end.
  const body = litProp(new BoxGeometry(TRUCK_BODY_W, TRUCK_BODY_H, TRUCK_BODY_D), TRUCK_BODY_COLOR);
  body.position.set(0, TRUCK_BODY_Y, 0);
  g.add(body);
  const cab = litProp(new BoxGeometry(TRUCK_CAB_W, TRUCK_BODY_H * 0.7, TRUCK_BODY_D), TRUCK_CAB_COLOR);
  cab.position.set(TRUCK_BODY_W / 2 + TRUCK_CAB_W / 2 - 0.02, TRUCK_BODY_Y - TRUCK_BODY_H * 0.15, 0);
  g.add(cab);

  // The serving window and a bright awning over it, on the +z (player) face.
  const windowX = -TRUCK_BODY_W * 0.08;
  const faceZ = TRUCK_BODY_D / 2 + 0.011;
  const serveWindow = litProp(new BoxGeometry(TRUCK_WINDOW_W, TRUCK_WINDOW_H, 0.02), TRUCK_WINDOW_COLOR);
  serveWindow.position.set(windowX, TRUCK_BODY_Y + 0.04, faceZ);
  g.add(serveWindow);
  const awning = litProp(new BoxGeometry(TRUCK_WINDOW_W + 0.14, 0.04, 0.2), TRUCK_AWNING_COLOR);
  awning.position.set(windowX, TRUCK_BODY_Y + TRUCK_WINDOW_H / 2 + 0.12, TRUCK_BODY_D / 2 + 0.1);
  awning.rotation.x = 0.5;
  g.add(awning);

  // A roof sign so it reads as Max's truck.
  const sign = createLabel("Max's Food Truck", { canvasW: 512, canvasH: 150, height: 0.16, bg: TRUCK_SIGN_COLOR });
  sign.mesh.position.set(0, TRUCK_BODY_Y + TRUCK_BODY_H / 2 + 0.14, TRUCK_BODY_D / 2 - 0.06);
  g.add(sign.mesh);

  // ---- The BUSY look: a glowing Open sign and a short line of customers ----
  const busy = new Group();
  const openSign = createLabel('Open!', { canvasW: 256, canvasH: 128, height: 0.11, bg: TRUCK_AWNING_COLOR });
  openSign.mesh.position.set(windowX + TRUCK_WINDOW_W / 2 + 0.14, TRUCK_BODY_Y + 0.08, faceZ + 0.02);
  busy.add(openSign.mesh);
  CUSTOMER_COLORS.forEach((color, i) => {
    const person = new Group();
    const legs = litProp(
      new CylinderGeometry(CUSTOMER_BODY_RADIUS * 0.5, CUSTOMER_BODY_RADIUS * 0.5, 0.16, 10),
      INK_DARK,
    );
    legs.position.y = 0.08;
    person.add(legs);
    const pbody = litProp(new SphereGeometry(CUSTOMER_BODY_RADIUS, 18, 18), color);
    pbody.position.y = 0.16 + CUSTOMER_BODY_RADIUS;
    person.add(pbody);
    const phead = litProp(new SphereGeometry(CUSTOMER_BODY_RADIUS * 0.62, 16, 16), MAX_HEAD_COLOR);
    phead.position.y = 0.16 + CUSTOMER_BODY_RADIUS * 2 + CUSTOMER_BODY_RADIUS * 0.35;
    person.add(phead);
    person.position.set(windowX + (i - 1) * CUSTOMER_SPACING, 0, TRUCK_BODY_D / 2 + 0.26);
    busy.add(person);
  });
  busy.visible = false;
  g.add(busy);

  // ---- The QUIET look: a grey wash over the front and a Slow day sign ----
  const quiet = new Group();
  const shadeMat = new MeshBasicMaterial({
    color: new Color(TRUCK_DIM_COLOR),
    transparent: true,
    opacity: 0.42,
    side: DoubleSide,
  });
  const shade = new Mesh(
    new PlaneGeometry(TRUCK_BODY_W + TRUCK_CAB_W, TRUCK_BODY_H + 0.32),
    shadeMat,
  );
  shade.position.set(0, TRUCK_BODY_Y, TRUCK_BODY_D / 2 + 0.07);
  quiet.add(shade);
  const slowSign = createLabel('Slow day', {
    canvasW: 256,
    canvasH: 128,
    height: 0.11,
    bg: TRUCK_DIM_COLOR,
    ink: PANEL_CREAM,
  });
  slowSign.mesh.position.set(windowX, TRUCK_BODY_Y + 0.08, faceZ + 0.04);
  quiet.add(slowSign.mesh);
  quiet.visible = false;
  g.add(quiet);

  g.position.set(TRUCK_X, 0, TRUCK_Z);
  g.rotation.y = TRUCK_FACE_TURN;
  world.createTransformEntity(g, { persistent: true });
  foodTruck = { busy, quiet };
}

// Show the busy (a hit) look and hide the quiet one.
function setFoodTruckBusy(): void {
  if (!foodTruck) return;
  foodTruck.quiet.visible = false;
  foodTruck.busy.visible = true;
}
// Show the quiet (a slow month) look and hide the busy one.
function setFoodTruckQuiet(): void {
  if (!foodTruck) return;
  foodTruck.busy.visible = false;
  foodTruck.quiet.visible = true;
}

// Build the food truck once, then reuse Max from Stage 1 and stand him next to
// it so it reads as Max's food truck. Only toggles/positions the prebuilt Max
// group (no entity creation), so it is safe to call from onResult.
function buildStage2Scene(world: World): void {
  if (!stage2SceneBuilt) {
    stage2SceneBuilt = true;
    buildFoodTruck(world);
  }
  if (maxState) {
    Animator.cancelFor(maxState.group);
    maxState.group.position.set(MAX_STAGE2_X, 0, MAX_STAGE2_Z);
    maxState.group.visible = true;
    maxState.revealed = true;
    Animator.squash(maxState.group); // a little hello bounce
  }
}

// ---- Stage 2 consequence helpers ----

// Penny's first wrap line, built from the end-of-stage total (rounded to whole
// dollars to match the scoreboard).
function stage2WrapLineOne(): string {
  return `Look at you, with a job and your own money! You have $${Math.round(totalMoney())} now.`;
}

// Configure the invest choice from what the student can now afford (savings plus
// piggy bank). Shows the tiers they can afford, always shows "Don't invest", and
// if they cannot afford even the low tier, turns the beat into a message (no
// decision) so its onResult shows the can't-afford line instead. Also captures
// the baseline for the "viewed the risk and reward" bonus.
function configureInvestChoice(s2Invest: Scenario): void {
  riskViewsBeforeInvest = game.riskInfoViews;
  const affordable = game.savings + game.piggyBank;
  const options: ChoiceOption[] = [];
  if (affordable >= INVEST_TIER_HIGH) {
    options.push({ label: `Invest $${INVEST_TIER_HIGH}`, value: String(INVEST_TIER_HIGH) });
  }
  if (affordable >= INVEST_TIER_LOW) {
    options.push({ label: `Invest $${INVEST_TIER_LOW}`, value: String(INVEST_TIER_LOW) });
  }
  options.push({ label: "Don't invest", value: '0' });

  if (affordable < INVEST_TIER_LOW) {
    s2Invest.decision = undefined; // can't afford even the low tier: a message beat
  } else {
    s2Invest.decision = {
      type: 'choice',
      prompt: PENNY_S2_INVEST_PROMPT,
      options,
      info: PENNY_S2_INVEST_INFO,
    };
  }
}

// Roll the market for any active investment, switch the truck to the matching
// look, grow or shrink the invested money, and write the line that describes it
// onto s2_market.setup (shown as the next beat). Called from s2_invest.onResult,
// so the truck and money are already settled when the market line appears.
function prepareMarket(s2Market: Scenario): void {
  if (game.investedValue > 0) {
    const old = Math.round(game.investedValue);
    if (Math.random() < INVEST_GOOD_PROBABILITY) {
      setFoodTruckBusy();
      game.investedValue = game.investedValue * INVEST_GOOD_MULTIPLIER;
      addGrowth(INVEST_GROWTH_BONUS);
      const grown = Math.round(game.investedValue);
      s2Market.setup =
        `Great news! Max's food truck is a hit. Customers are everywhere! Your $${old} investment grew to $${grown}. Investing paid off this time.`;
    } else {
      setFoodTruckQuiet();
      game.investedValue = game.investedValue * INVEST_BAD_MULTIPLIER;
      const left = Math.round(game.investedValue);
      s2Market.setup =
        `Max's food truck had a slow month. Your $${old} investment is now worth $${left}. That is the risk of investing. Sometimes you get back less than you put in, and that is okay to learn.`;
    }
    updateScoreboard(); // the invested money changed, so the total did too
  } else {
    s2Market.setup = PENNY_S2_MARKET_NO_INVEST;
  }
}

// End-of-stage bookkeeping, run as the market beat resolves so s2_wrap's first
// line reports the final total: apply one round of interest, reward keeping a
// buffer, snapshot the money for the summary, and write s2_wrap.setup.
function prepareWrap(s2Wrap: Scenario): void {
  if (game.savings > 0) {
    game.savings += game.savings * SAVINGS_INTEREST_RATE;
    addGrowth(INTEREST_BONUS);
  }
  if (game.savings + game.piggyBank >= BUFFER_THRESHOLD) addSecurity(BUFFER_BONUS);
  game.moneyStartStage3 = totalMoney();
  updateScoreboard();
  s2Wrap.setup = stage2WrapLineOne();
}

// Build the Stage 2 situation list. Later beats are configured/prepared by
// earlier ones (the engine shows setup before onResult), so the scenarios are
// declared as locals and captured in the closures.
function stage2Scenarios(world: World): Scenario[] {
  // Prepared by prepareWrap in s2_market.onResult; seeded so it is never empty.
  const s2Wrap: Scenario = {
    id: 's2_wrap',
    setup: stage2WrapLineOne(),
    onResult: () => {
      // Line one already showed as the setup. Chain lines two and three, then
      // hand off to Stage 3. The chain owns the rest, so stop the runner here.
      const lineTwo = investedThisStage ? PENNY_S2_WRAP_INVESTED : PENNY_S2_WRAP_SAFE;
      showGuideMessage(world, lineTwo, () => {
        showGuideMessage(world, PENNY_S2_WRAP_NEXT, () => {
          game.stage = 3;
          startStage3(world);
        });
      });
      return { penny: null, next: null };
    },
  };

  // Prepared by prepareMarket in s2_invest.onResult; seeded so it is never empty.
  const s2Market: Scenario = {
    id: 's2_market',
    setup: PENNY_S2_MARKET_NO_INVEST,
    onResult: () => {
      prepareWrap(s2Wrap); // interest, buffer, snapshot, and s2_wrap's first line
      return { penny: null }; // continue to s2_wrap (next in the list)
    },
  };

  // The invest decision. Its `decision` is configured in s2_paycheck.onResult,
  // once we know what the student can afford after the split.
  const s2Invest: Scenario = {
    id: 's2_invest',
    setup: PENNY_S2_INVEST_SETUP,
    onResult: (result) => {
      let outcome: string;
      if (result === undefined) {
        // No choice was shown (can't afford even the low tier): a message beat.
        outcome = PENNY_S2_CANT_AFFORD;
      } else {
        const amount = Number(result as string);
        // Looking before you leap is a Money Smarts win, whatever you then pick.
        if (game.riskInfoViews > riskViewsBeforeInvest) addSmarts(VIEWED_INFO_BONUS);
        if (amount > 0) {
          // Take the investment from savings first, then the piggy bank.
          let owed = amount;
          const fromSavings = Math.min(game.savings, owed);
          game.savings -= fromSavings;
          owed -= fromSavings;
          const fromPiggy = Math.min(game.piggyBank, owed);
          game.piggyBank -= fromPiggy;
          owed -= fromPiggy;
          game.investedValue += amount - owed; // what was actually moved in
          investedThisStage = true;
          updateScoreboard();
          // Draining the cushion to invest is an impulse move.
          if (game.savings + game.piggyBank < BUFFER_THRESHOLD) addSmarts(-IMPULSE_PENALTY);
          outcome = `You invested $${amount} in Max's truck. Now we wait and see how it does.`;
        } else {
          outcome = PENNY_S2_KEEP_SAFE;
        }
      }
      prepareMarket(s2Market); // roll now so the market line and the truck agree
      return { penny: outcome };
    },
  };

  const s2Paycheck: Scenario = {
    id: 's2_paycheck',
    setup: PENNY_S2_PAYCHECK,
    decision: {
      type: 'allocate',
      money: STAGE2_STARTING_FUNDS,
      billValue: BILL_VALUE_STAGE2,
      jars: STAGE2_TARGETS,
    },
    onResult: (result) => {
      const split = (result ?? {}) as RoundResult;
      const spend = split.spend ?? 0;
      const savings = split.savings ?? 0;
      game.spentTotal += spend;
      game.savings += savings;
      game.totalReceived += STAGE2_STARTING_FUNDS;
      // Putting any money in savings is a little Growth and Security win.
      if (savings > 0) {
        addGrowth(SAVE_BONUS);
        addSecurity(SAVE_BONUS);
      }
      configureInvestChoice(s2Invest); // build the invest options from the new balance
      const line = savings > spend ? PENNY_S2_PAYCHECK_SAVED : PENNY_S2_PAYCHECK_SPENT;
      return { penny: line };
    },
  };

  const s2Intro: Scenario = { id: 's2_intro', setup: PENNY_S2_INTRO };

  // A straight line: intro, paycheck, invest, market, wrap. The different
  // outcomes come from the student's choices and the market roll, not branching.
  return [s2Intro, s2Paycheck, s2Invest, s2Market, s2Wrap];
}

// STAGE 2: FIRST JOB AND INVESTING. Build the food truck and stand Max beside it,
// reset the stage's live state, then play the Stage 2 situations.
function startStage2(world: World): void {
  buildStage2Scene(world);
  investedThisStage = false;
  riskViewsBeforeInvest = game.riskInfoViews;
  runScenarios(world, stage2Scenarios(world));
}

// ============================================================
// STAGE 3: BIG DECISION AND DIVERSIFICATION (Step 6)
//
// You are grown up, with $200 to put to work. You spread it across four places
// (your own business, Max's business, savings, and a big dream), then a year
// passes: businesses boom or dip, a surprise expense hits, and Penny teaches
// diversifying (spreading money so one loss is softened by another's win). This
// is the last stage; it ends by handing off to showSummary(). Penny's exact
// words live in named constants below (5th grade, second person, no dashes). The
// spoken $200 and $30 match STAGE3_STARTING_FUNDS and SURPRISE_EXPENSE; if those
// constants change, the lines follow them.
//
// ENGINE NOTE (same as Stages 1 and 2): runScenarios shows a scenario's setup
// BEFORE its onResult runs, so any message whose words depend on a roll or a
// total is prepared in the PREVIOUS beat's onResult and stored on the later
// scenario's setup. So s3_allocate.onResult rolls the year (prepareBoomDip) and
// writes s3_boom_dip.setup, s3_surprise.onResult writes the diversify lesson's
// line, and s3_diversify_reveal.onResult does the end-of-game bookkeeping
// (prepareStage3Wrap) and writes s3_wrap's first line. This keeps each beat a
// single bubble with no invented text, and the business looks switch in step
// with the line that describes them.
// ============================================================

// ---- Penny's exact Stage 3 words ----
const PENNY_S3_INTRO =
  `You are all grown up now, with $${STAGE3_STARTING_FUNDS} to put to work! Here is a grown-up secret: do not put all your money in one place. If you spread it across different places, you are safer, because when one goes down, another might go up. You can put money into your own business, into Max's business, into savings, or toward a big dream. Let's decide together.`;
const PENNY_S3_ALLOCATE_SETUP =
  `Here is your $${STAGE3_STARTING_FUNDS}. Spread it across the four places however you want. Remember, mixing it up keeps you safer.`;
const PENNY_S3_ALLOCATE_SPREAD =
  "Nice, you spread it around. Let's see what the year brings.";
const PENNY_S3_ALLOCATE_PLACED =
  "Okay, your money is placed. Let's see what the year brings.";
// Both businesses funded: one booms, the other dips. The spec asks the line to
// name which is which; "Your own business" and "Max's business" keep it natural.
const PENNY_S3_BOOM_OWN =
  "A year passed. Big news! Your own business took off and grew a lot. But Max's business had a rough year and shrank. Because you put money in both, the win helped soften the loss.";
const PENNY_S3_BOOM_MAX =
  "A year passed. Big news! Max's business took off and grew a lot. But your own business had a rough year and shrank. Because you put money in both, the win helped soften the loss.";
// Only one business funded: it is a gamble that either pays off or does not.
const PENNY_S3_ONE_BOOM =
  'A year passed. Your business did great and grew! Putting it all in one place was lucky this time, but it was a gamble.';
const PENNY_S3_ONE_DIP =
  'A year passed. Your one business had a rough year and shrank. Putting it all in one place is a gamble, and this time it did not pay off.';
// No business funded: no risk, but no business growth either.
const PENNY_S3_BOOM_NEITHER =
  'A year passed. You kept all your money out of businesses and totally safe. You took no risk, but you also missed the chance to grow it.';
const PENNY_S3_SURPRISE_INTRO =
  `Then, out of nowhere, a surprise expense! Your car broke down and the repair costs $${SURPRISE_EXPENSE}.`;
const PENNY_S3_SURPRISE_COVERED =
  'Good thing you had savings set aside! You paid for it easily, without touching your dream or your business.';
const PENNY_S3_SURPRISE_UNCOVERED =
  'You had no cushion saved up, so you had to take from your dream fund or your business to pay for it. Keeping some money in savings for surprises really helps.';
const PENNY_S3_DIVERSIFY_YES =
  'Did you notice how spreading your money out protected you? That is called diversifying. When one thing went down, another helped make up for it. That is a really smart move!';
const PENNY_S3_DIVERSIFY_NO =
  'You kept your money in just one or two places. That can be risky. Spreading it across more places, which is called diversifying, helps protect you when one thing goes down. Try it next time!';
const PENNY_S3_WRAP_TWO = "Let's look back at everything you learned about money.";

// The four places the $200 is split across. These are passed to showMoneyRound,
// which builds the labeled jars at these spots; the storefront, food truck,
// savings bank, and big dream landmarks stand around the room behind them.
const STAGE3_TARGETS: RoundTarget[] = [
  { key: 'ownBiz', label: 'Your Business', color: CORAL, position: [-1.5 * STAGE3_JAR_SPACING_X, MONEY_TABLE_Y, JAR_CENTER_Z] },
  { key: 'maxBiz', label: "Max's Business", color: SMARTS_VIOLET, position: [-0.5 * STAGE3_JAR_SPACING_X, MONEY_TABLE_Y, JAR_CENTER_Z] },
  { key: 'savings', label: 'Savings', color: GROWTH_GREEN, position: [0.5 * STAGE3_JAR_SPACING_X, MONEY_TABLE_Y, JAR_CENTER_Z] },
  { key: 'dream', label: 'Big Dream', color: MONEY_GOLD, position: [1.5 * STAGE3_JAR_SPACING_X, MONEY_TABLE_Y, JAR_CENTER_Z] },
];

// ---- Stage 3 live state (reset at the start of the stage) ----
let stage3SceneBuilt = false;          // build the storefront and big dream only once
let storefront: { busy: Group; quiet: Group } | undefined; // your shop's two looks
let stage3OwnBiz = 0;                  // dollars you put into your own business
let stage3MaxBiz = 0;                  // dollars you put into Max's business
let stage3ChannelsUsed = 0;            // how many of the four places got money

// ---- Building your storefront and the big dream ----

// A five point star outline, used for the glowing gold goal star.
function makeStarShape(outer: number, inner: number, points: number): Shape {
  const shape = new Shape();
  const step = Math.PI / points; // half a turn between each outer and inner point
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = Math.PI / 2 + i * step; // start with a point at the top
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

// Your own storefront: a cute little shop that stands for your business. Like the
// food truck, it has two looks the year event switches between: a BUSY look (a
// glowing Open sign and a short line of customers) for a boom, and a QUIET look
// (a grey wash and a Quiet day sign, no customers) for a dip. It starts neutral
// (both looks hidden). Built persistent, once.
function buildStorefront(world: World): void {
  const g = new Group();

  // The shop walls and a bright peaked roof.
  const body = litProp(new BoxGeometry(SHOP_BODY_W, SHOP_BODY_H, SHOP_BODY_D), SHOP_WALL_COLOR);
  body.position.set(0, SHOP_BODY_H / 2, 0);
  g.add(body);
  const roof = litProp(new ConeGeometry(SHOP_BODY_W * 0.78, SHOP_ROOF_H, 4), SHOP_ROOF_COLOR);
  roof.rotation.y = Math.PI / 4; // square the pyramid to the walls
  roof.position.set(0, SHOP_BODY_H + SHOP_ROOF_H / 2, 0);
  g.add(roof);

  // The door, two windows, and a cheerful awning on the +z (player) face.
  const faceZ = SHOP_BODY_D / 2 + 0.011;
  const door = litProp(new BoxGeometry(SHOP_DOOR_W, SHOP_DOOR_H, 0.02), SHOP_DOOR_COLOR);
  door.position.set(0, SHOP_DOOR_H / 2, faceZ);
  g.add(door);
  for (const s of [-1, 1]) {
    const win = litProp(new BoxGeometry(0.18, 0.16, 0.02), SHOP_WINDOW_COLOR);
    win.position.set(s * SHOP_BODY_W * 0.3, SHOP_BODY_H * 0.62, faceZ);
    g.add(win);
  }
  const awning = litProp(new BoxGeometry(SHOP_BODY_W * 0.95, 0.04, 0.18), SHOP_AWNING_COLOR);
  awning.position.set(0, SHOP_BODY_H * 0.8, SHOP_BODY_D / 2 + 0.09);
  awning.rotation.x = 0.5;
  g.add(awning);

  // A sign so it reads as your shop.
  const sign = createLabel('Your Shop', { canvasW: 512, canvasH: 150, height: 0.13, bg: SHOP_SIGN_COLOR });
  sign.mesh.position.set(0, SHOP_BODY_H + 0.04, faceZ + 0.02);
  g.add(sign.mesh);

  // ---- The BUSY look: a glowing Open sign and a short line of customers ----
  const busy = new Group();
  const openSign = createLabel('Open!', { canvasW: 256, canvasH: 128, height: 0.1, bg: SHOP_AWNING_COLOR });
  openSign.mesh.position.set(SHOP_BODY_W * 0.34, SHOP_BODY_H * 0.5, faceZ + 0.02);
  busy.add(openSign.mesh);
  CUSTOMER_COLORS.forEach((color, i) => {
    const person = new Group();
    const legs = litProp(
      new CylinderGeometry(CUSTOMER_BODY_RADIUS * 0.5, CUSTOMER_BODY_RADIUS * 0.5, 0.16, 10),
      INK_DARK,
    );
    legs.position.y = 0.08;
    person.add(legs);
    const pbody = litProp(new SphereGeometry(CUSTOMER_BODY_RADIUS, 18, 18), color);
    pbody.position.y = 0.16 + CUSTOMER_BODY_RADIUS;
    person.add(pbody);
    const phead = litProp(new SphereGeometry(CUSTOMER_BODY_RADIUS * 0.62, 16, 16), MAX_HEAD_COLOR);
    phead.position.y = 0.16 + CUSTOMER_BODY_RADIUS * 2 + CUSTOMER_BODY_RADIUS * 0.35;
    person.add(phead);
    person.position.set((i - 1) * CUSTOMER_SPACING, 0, SHOP_BODY_D / 2 + 0.24);
    busy.add(person);
  });
  busy.visible = false;
  g.add(busy);

  // ---- The QUIET look: a grey wash over the front and a Quiet day sign ----
  const quiet = new Group();
  const shadeMat = new MeshBasicMaterial({
    color: new Color(SHOP_DIM_COLOR),
    transparent: true,
    opacity: 0.42,
    side: DoubleSide,
  });
  const shade = new Mesh(new PlaneGeometry(SHOP_BODY_W + 0.1, SHOP_BODY_H + 0.3), shadeMat);
  shade.position.set(0, SHOP_BODY_H / 2, SHOP_BODY_D / 2 + 0.06);
  quiet.add(shade);
  const quietSign = createLabel('Quiet day', {
    canvasW: 256,
    canvasH: 128,
    height: 0.1,
    bg: SHOP_DIM_COLOR,
    ink: PANEL_CREAM,
  });
  quietSign.mesh.position.set(0, SHOP_BODY_H * 0.5, faceZ + 0.04);
  quiet.add(quietSign.mesh);
  quiet.visible = false;
  g.add(quiet);

  g.position.set(SHOP_X, 0, SHOP_Z);
  g.rotation.y = SHOP_FACE_TURN;
  world.createTransformEntity(g, { persistent: true });
  storefront = { busy, quiet };
}

// Show your shop's busy (a boom) look and hide the quiet one.
function setStorefrontBusy(): void {
  if (!storefront) return;
  storefront.quiet.visible = false;
  storefront.busy.visible = true;
}
// Show your shop's quiet (a dip) look and hide the busy one.
function setStorefrontQuiet(): void {
  if (!storefront) return;
  storefront.busy.visible = false;
  storefront.quiet.visible = true;
}

// The big dream: a little model house on a stand, topped with a glowing gold
// star, to stand for saving toward something big. Built persistent, once.
function buildBigDream(world: World): void {
  const g = new Group();

  const stand = litProp(
    new CylinderGeometry(DREAM_STAND_RADIUS, DREAM_STAND_RADIUS * 1.15, DREAM_STAND_HEIGHT, 18),
    DREAM_STAND_COLOR,
  );
  stand.position.set(0, DREAM_STAND_HEIGHT / 2, 0);
  g.add(stand);

  const houseY = DREAM_STAND_HEIGHT + DREAM_HOUSE_H / 2;
  const house = litProp(new BoxGeometry(DREAM_HOUSE_W, DREAM_HOUSE_H, DREAM_HOUSE_D), DREAM_HOUSE_COLOR);
  house.position.set(0, houseY, 0);
  g.add(house);
  const roof = litProp(new ConeGeometry(DREAM_HOUSE_W * 0.82, DREAM_ROOF_H, 4), DREAM_ROOF_COLOR);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, DREAM_STAND_HEIGHT + DREAM_HOUSE_H + DREAM_ROOF_H / 2, 0);
  g.add(roof);
  const door = litProp(new BoxGeometry(DREAM_HOUSE_W * 0.3, DREAM_HOUSE_H * 0.55, 0.02), DREAM_DOOR_COLOR);
  door.position.set(0, DREAM_STAND_HEIGHT + DREAM_HOUSE_H * 0.275, DREAM_HOUSE_D / 2 + 0.011);
  g.add(door);

  // The glowing gold wishing star, facing the player above the roof.
  const starGeo = new ExtrudeGeometry(
    makeStarShape(DREAM_STAR_OUTER, DREAM_STAR_INNER, DREAM_STAR_POINTS),
    { depth: DREAM_STAR_DEPTH, bevelEnabled: false },
  );
  starGeo.center();
  const star = new Mesh(
    starGeo,
    new MeshStandardMaterial({
      color: new Color(DREAM_STAR_COLOR),
      emissive: new Color(DREAM_STAR_COLOR),
      emissiveIntensity: DREAM_STAR_EMISSIVE,
      roughness: SURFACE_ROUGHNESS,
    }),
  );
  star.castShadow = true;
  star.position.set(
    0,
    DREAM_STAND_HEIGHT + DREAM_HOUSE_H + DREAM_ROOF_H + DREAM_STAR_OUTER + DREAM_STAR_GAP,
    0,
  );
  g.add(star);

  g.position.set(DREAM_X, 0, DREAM_Z);
  world.createTransformEntity(g, { persistent: true });
}

// Build the two new Stage 3 landmarks once. The food truck (Max's business) and
// the savings bank are already in the room, reused from Stages 2 and 1.
function buildStage3Scene(world: World): void {
  if (stage3SceneBuilt) return;
  stage3SceneBuilt = true;
  buildStorefront(world);
  buildBigDream(world);
}

// ---- Stage 3 consequence helpers ----

// Roll the year for the two businesses, switch their looks to match, grow or
// shrink the money you put into them, and write the line that describes it onto
// s3_boom_dip.setup (shown as the next beat). Called from s3_allocate.onResult,
// so the businesses and money are already settled when the year line appears.
function prepareBoomDip(s3BoomDip: Scenario): void {
  const ownBiz = stage3OwnBiz;
  const maxBiz = stage3MaxBiz;
  const bizBefore = ownBiz + maxBiz; // what you put into businesses, before the year
  let bizResult = 0;                 // what it is worth after the year
  if (ownBiz > 0 && maxBiz > 0) {
    // Both funded: one booms and the other dips, picked by a coin flip.
    const ownBooms = Math.random() < 0.5;
    if (ownBooms) {
      bizResult = ownBiz * STAGE3_BOOM_MULTIPLIER + maxBiz * STAGE3_DIP_MULTIPLIER;
      setStorefrontBusy();
      setFoodTruckQuiet();
      s3BoomDip.setup = PENNY_S3_BOOM_OWN;
    } else {
      bizResult = maxBiz * STAGE3_BOOM_MULTIPLIER + ownBiz * STAGE3_DIP_MULTIPLIER;
      setFoodTruckBusy();
      setStorefrontQuiet();
      s3BoomDip.setup = PENNY_S3_BOOM_MAX;
    }
    game.investedValue += bizResult;
  } else if (ownBiz > 0 || maxBiz > 0) {
    // Only one funded: a gamble with a 50/50 boom or dip.
    const booms = Math.random() < 0.5;
    if (ownBiz > 0) {
      bizResult = booms ? ownBiz * STAGE3_BOOM_MULTIPLIER : ownBiz * STAGE3_DIP_MULTIPLIER;
      if (booms) setStorefrontBusy();
      else setStorefrontQuiet();
    } else {
      bizResult = booms ? maxBiz * STAGE3_BOOM_MULTIPLIER : maxBiz * STAGE3_DIP_MULTIPLIER;
      if (booms) setFoodTruckBusy();
      else setFoodTruckQuiet();
    }
    s3BoomDip.setup = booms ? PENNY_S3_ONE_BOOM : PENNY_S3_ONE_DIP;
    game.investedValue += bizResult;
  } else {
    // Neither funded: no business money rides on the year.
    s3BoomDip.setup = PENNY_S3_BOOM_NEITHER;
  }
  // Coming out of the year ahead of what you put in is a growth win.
  if (bizResult > bizBefore) addGrowth(INVEST_GROWTH_BONUS);
  updateScoreboard(); // business money (the total) changed
}

// Penny's first wrap line, built from the end-of-game total (rounded to whole
// dollars to match the scoreboard).
function stage3WrapLineOne(): string {
  return `What a journey! You went from a kid with birthday money to an adult running businesses. You have $${Math.round(totalMoney())} now.`;
}

// End-of-game bookkeeping, run as the diversify beat resolves so s3_wrap's first
// line reports the final total: apply one round of interest, reward keeping a
// buffer, snapshot the money for the summary, and write s3_wrap.setup.
function prepareStage3Wrap(s3Wrap: Scenario): void {
  if (game.savings > 0) {
    game.savings += game.savings * SAVINGS_INTEREST_RATE;
    addGrowth(INTEREST_BONUS);
  }
  if (game.savings + game.piggyBank >= BUFFER_THRESHOLD) addSecurity(BUFFER_BONUS);
  game.moneyEnd = totalMoney();
  updateScoreboard();
  s3Wrap.setup = stage3WrapLineOne();
}

// Build the Stage 3 situation list. Later beats are configured/prepared by
// earlier ones (the engine shows setup before onResult), so the scenarios are
// declared as locals and captured in the closures.
function stage3Scenarios(world: World): Scenario[] {
  // Prepared by prepareStage3Wrap in s3_diversify_reveal.onResult; seeded so it
  // is never empty.
  const s3Wrap: Scenario = {
    id: 's3_wrap',
    setup: stage3WrapLineOne(),
    onResult: () => {
      // Line one already showed as the setup. Show line two, then open the
      // summary. The chain owns the rest, so stop the runner here.
      showGuideMessage(world, PENNY_S3_WRAP_TWO, () => showSummary(world));
      return { penny: null, next: null };
    },
  };

  // The diversifying lesson. Its dynamic line is written by s3_surprise.onResult.
  const s3DiversifyReveal: Scenario = {
    id: 's3_diversify_reveal',
    setup: PENNY_S3_DIVERSIFY_NO, // seeded; the real line is written before this beat
    onResult: () => {
      // Spreading across enough places earns the security and smarts payoff. Keep
      // it in one or two places and no points are lost, just a gentle lesson.
      if (stage3ChannelsUsed >= DIVERSIFY_MIN_CHANNELS) {
        addSecurity(DIVERSIFY_BONUS);
        addSmarts(MATCHED_SITUATION_BONUS);
        game.matchedMoves += 1;
      }
      prepareStage3Wrap(s3Wrap); // interest, buffer, snapshot, and the wrap's line one
      return { penny: null }; // line already shown as setup; continue to the wrap
    },
  };

  // The surprise expense. The static intro is the setup; the outcome line depends
  // on whether you had a cushion. Also writes the diversify lesson's line.
  const s3Surprise: Scenario = {
    id: 's3_surprise',
    setup: PENNY_S3_SURPRISE_INTRO,
    onResult: () => {
      let outcome: string;
      const cushion = game.savings + game.piggyBank;
      if (cushion >= SURPRISE_EXPENSE) {
        // Pay it from savings first, then the piggy bank.
        let owed = SURPRISE_EXPENSE;
        const fromSavings = Math.min(game.savings, owed);
        game.savings -= fromSavings;
        owed -= fromSavings;
        const fromPiggy = Math.min(game.piggyBank, owed);
        game.piggyBank -= fromPiggy;
        owed -= fromPiggy;
        game.spentTotal += SURPRISE_EXPENSE;
        addSecurity(COVERED_EXPENSE_BONUS);
        outcome = PENNY_S3_SURPRISE_COVERED;
      } else {
        // No cushion: pay what you can, then dip into the dream, then the business.
        let owed = SURPRISE_EXPENSE;
        const fromSavings = Math.min(game.savings, owed);
        game.savings -= fromSavings;
        owed -= fromSavings;
        const fromPiggy = Math.min(game.piggyBank, owed);
        game.piggyBank -= fromPiggy;
        owed -= fromPiggy;
        const fromDream = Math.min(game.goalFund, owed);
        game.goalFund -= fromDream;
        owed -= fromDream;
        const fromInvest = Math.min(game.investedValue, owed);
        game.investedValue -= fromInvest;
        owed -= fromInvest;
        game.spentTotal += SURPRISE_EXPENSE;
        outcome = PENNY_S3_SURPRISE_UNCOVERED;
      }
      updateScoreboard();
      // Write the diversifying lesson's line now (the beat right after this one).
      s3DiversifyReveal.setup =
        stage3ChannelsUsed >= DIVERSIFY_MIN_CHANNELS ? PENNY_S3_DIVERSIFY_YES : PENNY_S3_DIVERSIFY_NO;
      return { penny: outcome };
    },
  };

  // The year's results. Its dynamic line and the business looks are set by
  // s3_allocate.onResult (prepareBoomDip), so nothing is left to do here.
  const s3BoomDip: Scenario = {
    id: 's3_boom_dip',
    setup: PENNY_S3_BOOM_NEITHER, // seeded; the real line is written before this beat
  };

  // Spread your $200 across the four places.
  const s3Allocate: Scenario = {
    id: 's3_allocate',
    setup: PENNY_S3_ALLOCATE_SETUP,
    decision: {
      type: 'allocate',
      money: STAGE3_STARTING_FUNDS,
      billValue: BILL_VALUE_STAGE3,
      jars: STAGE3_TARGETS,
    },
    onResult: (result) => {
      const split = (result ?? {}) as RoundResult;
      const ownBiz = split.ownBiz ?? 0;
      const maxBiz = split.maxBiz ?? 0;
      const save = split.savings ?? 0;
      const dream = split.dream ?? 0;
      // The year event needs the two business amounts.
      stage3OwnBiz = ownBiz;
      stage3MaxBiz = maxBiz;
      game.savings += save;
      game.goalFund += dream;
      game.totalReceived += STAGE3_STARTING_FUNDS;
      // How many of the four places got money (the heart of diversifying).
      stage3ChannelsUsed = [ownBiz, maxBiz, save, dream].filter((a) => a > 0).length;
      updateScoreboard();
      prepareBoomDip(s3BoomDip); // roll the year, switch the looks, write its line
      const line =
        stage3ChannelsUsed >= DIVERSIFY_MIN_CHANNELS ? PENNY_S3_ALLOCATE_SPREAD : PENNY_S3_ALLOCATE_PLACED;
      return { penny: line };
    },
  };

  const s3Intro: Scenario = { id: 's3_intro', setup: PENNY_S3_INTRO };

  // A straight line: intro, allocate, the year's boom and dip, the surprise
  // expense, the diversifying lesson, then the wrap. The different outcomes come
  // from how you spread your money and the year's roll, not from branching.
  return [s3Intro, s3Allocate, s3BoomDip, s3Surprise, s3DiversifyReveal, s3Wrap];
}

// STAGE 3: BIG DECISION AND DIVERSIFICATION. Build the two new landmarks (the
// food truck and savings bank are already in the room), reset the stage's live
// state, then play the Stage 3 situations.
function startStage3(world: World): void {
  buildStage3Scene(world);
  stage3OwnBiz = 0;
  stage3MaxBiz = 0;
  stage3ChannelsUsed = 0;
  runScenarios(world, stage3Scenarios(world));
}

// ============================================================
// FINANCIAL SUMMARY (Step 7) - the Money Report board and Penny's recap
//
// The end of the game. A big friendly Money Report board appears in front of you
// with three sections that reveal one at a time as Penny walks you through them:
// (A) a journey chart of how much money you had at each part of your life, (B) the
// three skill meters out of 100, and (C) a money personality badge. This only
// READS the game state and the meters; it never changes them. The board is its own
// persistent object (not part of the onboarding screen lifecycle), so Penny's
// bubbles tear down and swap above it while the board stays put, and it is left
// standing at the very end.
//
// ENGINE NOTES (reused from the earlier steps): showSummary runs on a microtask
// (the Stage 3 wrap hands off through a guide-message button), so creating the
// board's entity here is safe. The reveals only toggle visibility and animate, so
// they are safe from any callback. The recap is a chain of showGuideMessage calls,
// the same friendly bubble every stage uses.
// ============================================================

// ---- Penny's exact summary words (5th grade, second person, no dashes) ----
// The spoken dollar amounts and meter numbers are filled in from the game state.
const PENNY_SUM_WELCOME =
  "You did it! You made it all the way from a kid with birthday money to a grown-up running businesses. Let's look back at your money journey.";
const PENNY_SUM_PERSONALITY_INTRO =
  'And now for the best part. After everything you did with your money, your money personality is...';
const PENNY_SUM_GOODBYE =
  'Amazing work today. You are on your way to being smart with money for life!';
const PENNY_SUM_THANKS = 'Thanks for playing! You can take off the headset now.';

// Penny's first journey line names your starting money (your birthday money).
function pennySumJourneyLineOne(): string {
  return `Here is how much money you had at each part of your life. You started with $${Math.round(game.moneyStartStage1)} as a kid.`;
}
// Her second journey line compares where you ended up to where you began. A few
// dollars either way of your start counts as having held onto your money.
function pennySumJourneyLineTwo(): string {
  const end = Math.round(game.moneyEnd);
  const start = Math.round(game.moneyStartStage1);
  if (end > start + SUMMARY_CLOSE_DOLLARS) {
    return `And look, now you have $${end}. Your money grew over time!`;
  }
  if (end >= start - SUMMARY_CLOSE_DOLLARS) {
    return `And now you have $${end}. You held onto your money through it all.`;
  }
  return `And now you have $${end}. Money goes up and down, and every choice taught you something.`;
}
// The three skills line reads each meter as a plain number out of 100 (no dollars,
// since these are skill points and not money).
function pennySumSkillsLine(): string {
  return (
    'These are your three money skills. ' +
    `Financial Growth is at ${Math.round(game.growthMeter)} out of 100, which is how much you grew your money. ` +
    `Financial Security is at ${Math.round(game.securityMeter)} out of 100, which is how safe and ready you are for surprises. ` +
    `Money Smarts is at ${Math.round(game.smartsMeter)} out of 100, which is how wisely you made your choices.`
  );
}

// ---- The four money personalities ----
// Each has a name, the exact description Penny reads, and a medal color. The badge
// star is always gold; the ring color gives each type its own flavor.
interface Personality {
  name: string;
  description: string;
  color: string;
}
const PERSONALITY_SAVER: Personality = {
  name: 'Careful Saver',
  description:
    'You love keeping your money safe and growing it slowly and surely, and you always have a cushion for surprises. Savers build strong, steady futures.',
  color: SECURITY_BLUE,
};
const PERSONALITY_INVESTOR: Personality = {
  name: 'Bold Investor',
  description:
    'You are not afraid to take a smart risk to grow your money, and you put your money to work in businesses. Investors can grow their money faster, as long as they stay careful.',
  color: CORAL,
};
const PERSONALITY_DIVERSIFIER: Personality = {
  name: 'Smart Diversifier',
  description:
    'You learned the smartest trick of all, spreading your money across different places so you are protected no matter what happens. That is exactly what money experts do!',
  color: SMARTS_VIOLET,
};
const PERSONALITY_BALANCED: Personality = {
  name: 'Balanced Builder',
  description:
    'You do a little of everything, saving some, investing some, and keeping some for your dreams. A good balance is one of the wisest ways to handle money.',
  color: GROWTH_GREEN,
};

// Work out the money personality from how the student played. The order matters:
// stop at the first match. Spreading out in Stage 3 (a matched move) wins first;
// then a clear lean toward saving or investing; otherwise a balanced mix.
function moneyPersonality(): Personality {
  if (game.matchedMoves >= 1) return PERSONALITY_DIVERSIFIER;
  if (game.savings > game.investedValue * PERSONALITY_RATIO) return PERSONALITY_SAVER;
  if (game.investedValue > game.savings * PERSONALITY_RATIO) return PERSONALITY_INVESTOR;
  return PERSONALITY_BALANCED;
}

// ---- The Money Report board ----
// Built once as a single persistent group: a cream poster with a coral frame, a
// title, and three child sections that start hidden and reveal one at a time. The
// section groups and their bars are kept here so the reveal helpers can grow them.
interface SummaryBar {
  mesh: Mesh;     // the bar box (its geometry is the bar's full final height)
  height: number; // that final height in meters
  baseY: number;  // the local baseline its bottom rests on
}
let summaryBoard:
  | {
      journey: Group;
      journeyBars: SummaryBar[];
      meters: Group;
      meterBars: SummaryBar[];
      badge: Group;
    }
  | undefined;

// Add a text chip to a section at a local position. A small wrapper around
// createLabel so the board code stays readable.
function addBoardLabel(
  parent: Group,
  text: string,
  x: number,
  y: number,
  height: number,
  opts: { canvasW?: number; canvasH?: number; bg?: string; ink?: string; bold?: boolean } = {},
): void {
  const label = createLabel(text, { ...opts, height });
  label.mesh.position.set(x, y, REPORT_CONTENT_Z + 0.005);
  parent.add(label.mesh);
}

// Build one colored bar (a money bar or a meter bar) whose box geometry is its
// final height, parked collapsed at the baseline so a reveal can grow it up.
function makeBoardBar(
  parent: Group,
  x: number,
  baseY: number,
  height: number,
  width: number,
  depth: number,
  color: string,
): SummaryBar {
  const h = Math.max(0.002, height); // a valid box even when a meter reads zero
  const mesh = new Mesh(
    new BoxGeometry(width, h, depth),
    new MeshStandardMaterial({ color: new Color(color), roughness: SURFACE_ROUGHNESS }),
  );
  mesh.position.set(x, baseY, REPORT_CONTENT_Z);
  mesh.scale.y = 0; // start collapsed; the reveal grows it up
  parent.add(mesh);
  return { mesh, height: h, baseY };
}

// Grow a bar up from its baseline with a springy bounce, keeping its bottom put.
function growBar(bar: SummaryBar): void {
  Animator.cancelFor(bar.mesh);
  Animator.run(
    REPORT_BAR_GROW_TIME,
    (p) => {
      const s = Math.max(0, easeOutBack(p));
      bar.mesh.scale.y = s;
      bar.mesh.position.y = bar.baseY + (s * bar.height) / 2;
    },
    {
      target: bar.mesh,
      onComplete: () => {
        bar.mesh.scale.y = 1;
        bar.mesh.position.y = bar.baseY + bar.height / 2;
      },
    },
  );
}

// Build the whole Money Report board, every section hidden, and remember it.
function buildSummaryBoard(world: World, personality: Personality): void {
  if (summaryBoard) return; // built once
  const board = new Group();

  // The coral frame behind the cream face, like the scoreboard sign.
  const frame = new Mesh(
    new BoxGeometry(REPORT_W + REPORT_FRAME_PAD * 2, REPORT_H + REPORT_FRAME_PAD * 2, REPORT_FRAME_DEPTH),
    new MeshStandardMaterial({ color: new Color(CORAL), roughness: SURFACE_ROUGHNESS }),
  );
  frame.position.set(0, 0, -REPORT_FRAME_DEPTH / 2);
  frame.receiveShadow = true;
  board.add(frame);

  const face = new Mesh(
    new BoxGeometry(REPORT_W, REPORT_H, REPORT_FACE_DEPTH),
    new MeshStandardMaterial({ color: new Color(PANEL_CREAM), roughness: SURFACE_ROUGHNESS }),
  );
  face.position.set(0, 0, REPORT_FACE_DEPTH / 2);
  face.receiveShadow = true;
  board.add(face);

  // The title banner, always shown.
  addBoardLabel(board, REPORT_TITLE_TEXT, 0, REPORT_TITLE_LOCAL_Y, REPORT_TITLE_H, {
    canvasW: 640,
    canvasH: 160,
    bg: CORAL,
    ink: PANEL_CREAM,
    bold: true,
  });

  // ---- Section A: the journey chart (hidden until Beat 2) ----
  const journey = new Group();
  journey.visible = false;
  const moneyValues = [
    Math.round(game.moneyStartStage1),
    Math.round(game.moneyStartStage2),
    Math.round(game.moneyStartStage3),
    Math.round(game.moneyEnd),
  ];
  const maxMoney = Math.max(1, ...moneyValues); // scale to the tallest; never divide by zero
  const journeyBars: SummaryBar[] = [];
  moneyValues.forEach((value, i) => {
    const x = (i - (moneyValues.length - 1) / 2) * JOURNEY_BAR_PITCH;
    const height = Math.max(JOURNEY_BAR_MIN_H, (JOURNEY_BAR_MAX_H * value) / maxMoney);
    journeyBars.push(
      makeBoardBar(journey, x, JOURNEY_BASE_LOCAL_Y, height, JOURNEY_BAR_W, JOURNEY_BAR_D, JOURNEY_BAR_COLOR),
    );
    // The dollar amount floats just above the bar's final top.
    addBoardLabel(journey, `$${value}`, x, JOURNEY_BASE_LOCAL_Y + height + JOURNEY_AMOUNT_GAP, JOURNEY_AMOUNT_H, {
      canvasW: 256,
      canvasH: 110,
      bold: true,
    });
    // The period label sits just below the baseline.
    addBoardLabel(journey, JOURNEY_PERIOD_LABELS[i], x, JOURNEY_PERIOD_LOCAL_Y, JOURNEY_PERIOD_H, {
      canvasW: 320,
      canvasH: 96,
    });
  });
  board.add(journey);

  // ---- Section B: the three skill meters (hidden until Beat 3) ----
  const meters = new Group();
  meters.visible = false;
  const meterValues = [
    Math.round(game.growthMeter),
    Math.round(game.securityMeter),
    Math.round(game.smartsMeter),
  ];
  const meterBars: SummaryBar[] = [];
  meterValues.forEach((value, i) => {
    const x = METER_CENTER_X + (i - 1) * METER_BAR_PITCH;
    const safe = Math.max(0, Math.min(METER_VALUE_MAX, value));
    const height = (METER_BAR_MAX_H * safe) / METER_VALUE_MAX;
    meterBars.push(
      makeBoardBar(meters, x, METER_BASE_LOCAL_Y, height, METER_BAR_W, METER_BAR_D, METER_BAR_COLORS[i]),
    );
    // The value out of 100 floats above the bar (no dollar sign: these are points).
    addBoardLabel(meters, `${value} / ${METER_VALUE_MAX}`, x, METER_BASE_LOCAL_Y + height + METER_VALUE_GAP, METER_VALUE_H, {
      canvasW: 256,
      canvasH: 96,
      bold: true,
    });
    // The short skill label sits below the bar.
    addBoardLabel(meters, METER_BAR_LABELS[i], x, METER_LABEL_LOCAL_Y, METER_LABEL_H, {
      canvasW: 256,
      canvasH: 96,
    });
  });
  board.add(meters);

  // ---- Section C: the personality badge (hidden until Beat 4) ----
  const badge = new Group();
  badge.visible = false;
  badge.position.set(BADGE_LOCAL_X, BADGE_LOCAL_Y, REPORT_CONTENT_Z);

  const disc = new Mesh(
    new CylinderGeometry(BADGE_DISC_RADIUS, BADGE_DISC_RADIUS, BADGE_DISC_DEPTH, 36),
    new MeshStandardMaterial({
      color: new Color(personality.color),
      roughness: SURFACE_ROUGHNESS,
      emissive: new Color(personality.color),
      emissiveIntensity: BADGE_DISC_EMISSIVE,
    }),
  );
  disc.rotation.x = Math.PI / 2; // turn the medal's round face toward you
  badge.add(disc);

  const starGeo = new ExtrudeGeometry(
    makeStarShape(BADGE_STAR_OUTER, BADGE_STAR_INNER, BADGE_STAR_POINTS),
    { depth: BADGE_STAR_DEPTH, bevelEnabled: false },
  );
  starGeo.center();
  const star = new Mesh(
    starGeo,
    new MeshStandardMaterial({
      color: new Color(BADGE_STAR_COLOR),
      roughness: SURFACE_ROUGHNESS,
      emissive: new Color(BADGE_STAR_COLOR),
      emissiveIntensity: BADGE_STAR_EMISSIVE,
    }),
  );
  star.position.set(0, 0, BADGE_DISC_DEPTH / 2 + BADGE_STAR_DEPTH / 2 + 0.005);
  badge.add(star);

  // A caption above the medal and the personality name on a colored ribbon below.
  const caption = createLabel(BADGE_CAPTION_TEXT, { canvasW: 512, canvasH: 110, height: BADGE_CAPTION_H });
  caption.mesh.position.set(0, BADGE_DISC_RADIUS + BADGE_CAPTION_GAP, 0.01);
  badge.add(caption.mesh);
  const nameLabel = createLabel(personality.name, {
    canvasW: 512,
    canvasH: 150,
    height: BADGE_NAME_H,
    bg: personality.color,
    ink: PANEL_CREAM,
    bold: true,
  });
  nameLabel.mesh.position.set(0, -(BADGE_DISC_RADIUS + BADGE_NAME_GAP), 0.01);
  badge.add(nameLabel.mesh);
  board.add(badge);

  board.position.set(REPORT_X, REPORT_Y, REPORT_Z);
  world.createTransformEntity(board, { persistent: true });
  summaryBoard = { journey, journeyBars, meters, meterBars, badge };
}

// Reveal Section A and grow its four money bars.
function revealJourney(): void {
  if (!summaryBoard) return;
  summaryBoard.journey.visible = true;
  for (const bar of summaryBoard.journeyBars) growBar(bar);
}

// Reveal Section B and fill its three skill meters.
function revealMeters(): void {
  if (!summaryBoard) return;
  summaryBoard.meters.visible = true;
  for (const bar of summaryBoard.meterBars) growBar(bar);
}

// Reveal Section C: pop the personality badge in, with a chime and confetti.
function revealBadge(world: World): void {
  if (!summaryBoard) return;
  const badge = summaryBoard.badge;
  badge.visible = true;
  badge.scale.setScalar(0.01);
  Animator.run(
    REPORT_REVEAL_POP_TIME,
    (p) => badge.scale.setScalar(lerp(0.01, 1, easeOutBack(p))),
    { target: badge },
  );
  Sound.chime();
  spawnBurst(
    world,
    new Vector3(REPORT_X + BADGE_LOCAL_X, REPORT_Y + BADGE_LOCAL_Y, REPORT_Z + REPORT_BURST_Z_OFFSET),
    BURST_BIG,
  );
}

// The final choice: play again (a clean page reload) or finish (a goodbye, with the
// report board left standing).
function showSummaryEndChoice(world: World): void {
  showChoice(world, {
    prompt: 'Want to play again?',
    options: [
      { label: 'Play Again', value: 'again' },
      { label: "I'm Finished", value: 'done' },
    ],
    onPick: (value) => {
      if (value === 'again') {
        window.location.reload(); // restart the whole experience from scratch
      } else {
        showGuideMessage(world, PENNY_SUM_THANKS, () => {}); // leave the board up
      }
    },
  });
}

// The end-of-game recap. Build the Money Report board (sections hidden), work out
// the money personality, then play the five beats in order, revealing the matching
// section as each beat appears.
function showSummary(world: World): void {
  const personality = moneyPersonality();
  buildSummaryBoard(world, personality);

  // BEAT 1: welcome back, with a happy sound and confetti. Reveal nothing yet.
  Sound.chime();
  spawnBurst(
    world,
    new Vector3(REPORT_X, REPORT_Y + REPORT_WELCOME_BURST_LOCAL_Y, REPORT_Z + REPORT_BURST_Z_OFFSET),
    BURST_BIG,
  );
  showGuideMessage(world, PENNY_SUM_WELCOME, () => beat2());

  // BEAT 2: the journey chart. Reveal Section A and grow the bars, then two lines.
  function beat2(): void {
    revealJourney();
    showGuideMessage(world, pennySumJourneyLineOne(), () =>
      showGuideMessage(world, pennySumJourneyLineTwo(), () => beat3()),
    );
  }

  // BEAT 3: the three meters. Reveal Section B and fill the meters.
  function beat3(): void {
    revealMeters();
    showGuideMessage(world, pennySumSkillsLine(), () => beat4());
  }

  // BEAT 4: the personality reveal. A suspense line, then the badge and name with
  // confetti, then the description that matches the personality.
  function beat4(): void {
    showGuideMessage(world, PENNY_SUM_PERSONALITY_INTRO, () => {
      revealBadge(world);
      showGuideMessage(world, `${personality.name}!`, () =>
        showGuideMessage(world, personality.description, () => beat5()),
      );
    });
  }

  // BEAT 5: the goodbye, then the play again or finished choice.
  function beat5(): void {
    showGuideMessage(world, PENNY_SUM_GOODBYE, () => showSummaryEndChoice(world));
  }
}

// ============================================================
// GROUNDED ROOM ENVIRONMENT (visual upgrade)
// Procedural helpers that dress the bare shell into a believable cozy room: a
// wood floor, painted walls with a wainscot and trim, a ceiling, a daylight
// window, a soft rug, and a few warm props. Everything is built from lit Three
// primitives and canvas textures (no heavy assets), so it stays fast on the
// headset and the laptop alike. Called once from World.create below.
// ============================================================

// Draw a warm wood-plank texture (rows of planks with soft grain) onto a canvas.
// It tiles across the floor, so the floor reads as real boards, not flat color.
function makeWoodFloorTexture(): CanvasTexture {
  const px = FLOOR_TEXTURE_PX;
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = FLOOR_WOOD_BASE;
  ctx.fillRect(0, 0, px, px);
  const rowH = px / FLOOR_PLANK_ROWS;
  for (let row = 0; row < FLOOR_PLANK_ROWS; row++) {
    const y = row * rowH;
    // Each plank is a slightly different shade so the floor is not uniform.
    const shade = lerp(0.92, 1.06, Math.random());
    const c = new Color(FLOOR_WOOD_BASE).multiplyScalar(shade);
    ctx.fillStyle = `#${c.getHexString()}`;
    ctx.fillRect(0, y + 1, px, rowH - 2);
    // A darker seam between planks.
    ctx.strokeStyle = FLOOR_WOOD_GRAIN;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y + rowH);
    ctx.lineTo(px, y + rowH);
    ctx.stroke();
    // A few faint grain streaks along the plank.
    ctx.strokeStyle = FLOOR_WOOD_GRAIN;
    ctx.globalAlpha = 0.12;
    ctx.lineWidth = 1;
    for (let g = 0; g < 5; g++) {
      const gy = y + rowH * (0.2 + 0.6 * Math.random());
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(px * 0.3, gy + 3, px * 0.6, gy - 3, px, gy + 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(FLOOR_PLANK_REPEAT, FLOOR_PLANK_REPEAT);
  return texture;
}

// Draw a soft daylight sky (a top-to-bottom gradient with a couple of clouds)
// for the window pane, so the room feels like it opens onto a bright day.
function makeWindowSkyTexture(): CanvasTexture {
  const w = 256;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, WINDOW_SKY_TOP);
  grad.addColorStop(1, WINDOW_SKY_BOTTOM);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // A soft sun glow in the upper area.
  const sun = ctx.createRadialGradient(w * 0.72, h * 0.28, 4, w * 0.72, h * 0.28, h * 0.32);
  sun.addColorStop(0, 'rgba(255,250,225,0.95)');
  sun.addColorStop(1, 'rgba(255,250,225,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
  // A couple of gentle clouds.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const [cx, cy, cr] of [[w * 0.3, h * 0.5, 26], [w * 0.55, h * 0.66, 20], [w * 0.2, h * 0.7, 18]] as const) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, cr * 1.6, cr, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// Build one painted wall with a wainscot panel, a chair rail, a baseboard, and
// crown molding on its inward face. axis is the wall's normal ('x' for the side
// walls, 'z' for the back and front); sign points into the room.
function buildWall(
  world: World,
  axis: 'x' | 'z',
  sign: 1 | -1,
  span: number,
  cx: number,
  cz: number,
  mats: { paint: MeshStandardMaterial; wainscot: MeshStandardMaterial; trim: MeshStandardMaterial },
): void {
  const group = new Group();
  const wallDims: [number, number, number] =
    axis === 'z' ? [span, WALL_HEIGHT, WALL_THICKNESS] : [WALL_THICKNESS, WALL_HEIGHT, span];
  const wall = new Mesh(new BoxGeometry(wallDims[0], wallDims[1], wallDims[2]), mats.paint);
  wall.position.set(cx, WALL_HEIGHT / 2, cz);
  wall.receiveShadow = true;
  group.add(wall);

  const faceCoord = (axis === 'z' ? cz : cx) + sign * (WALL_THICKNESS / 2);
  const along = span * TRIM_INSET;
  // A horizontal trim strip standing proud of the wall face by `depthOut`.
  const strip = (lenAlong: number, height: number, depthOut: number, y: number, mat: MeshStandardMaterial): Mesh => {
    const dims: [number, number, number] =
      axis === 'z' ? [lenAlong, height, depthOut] : [depthOut, height, lenAlong];
    const m = new Mesh(new BoxGeometry(dims[0], dims[1], dims[2]), mat);
    m.receiveShadow = true;
    const normal = faceCoord + sign * (depthOut / 2);
    if (axis === 'z') m.position.set(cx, y, normal);
    else m.position.set(normal, y, cz);
    return m;
  };

  group.add(strip(along, WAINSCOT_HEIGHT, TRIM_DEPTH, WAINSCOT_HEIGHT / 2, mats.wainscot));
  group.add(strip(along, CHAIR_RAIL_HEIGHT, CHAIR_RAIL_DEPTH, WAINSCOT_HEIGHT, mats.trim));
  group.add(strip(along, BASEBOARD_HEIGHT, BASEBOARD_DEPTH, BASEBOARD_HEIGHT / 2, mats.trim));
  group.add(strip(along, CROWN_HEIGHT, CROWN_DEPTH, WALL_HEIGHT - CROWN_HEIGHT / 2, mats.trim));
  world.createTransformEntity(group);
}

// A soft round rug under the play area: a cream border ring with a colored field.
function buildRug(world: World): void {
  const group = new Group();
  const border = new Mesh(
    new CircleGeometry(RUG_RADIUS, 48),
    new MeshStandardMaterial({ color: new Color(RUG_BORDER_COLOR), roughness: 1 }),
  );
  border.rotation.x = -Math.PI / 2;
  border.position.set(0, RUG_Y, RUG_CENTER_Z);
  border.receiveShadow = true;
  group.add(border);
  const field = new Mesh(
    new CircleGeometry(RUG_INNER_RADIUS, 48),
    new MeshStandardMaterial({ color: new Color(RUG_COLOR), roughness: 1 }),
  );
  field.rotation.x = -Math.PI / 2;
  field.position.set(0, RUG_Y + 0.001, RUG_CENTER_Z);
  field.receiveShadow = true;
  group.add(field);
  world.createTransformEntity(group);
}

// A bright daylight window on the right wall: a glowing sky pane in a white
// frame with muntins and a sill, plus a soft point light that spills in.
function buildWindow(world: World, halfW: number): void {
  const group = new Group();
  const faceX = halfW - WALL_THICKNESS / 2; // inner face of the right wall
  const intoRoom = -1; // the room is at smaller x than the right wall
  const frameX = faceX + intoRoom * (WINDOW_FRAME_DEPTH / 2);
  const frameMat = new MeshStandardMaterial({
    color: new Color(WINDOW_FRAME_COLOR),
    roughness: SURFACE_ROUGHNESS,
  });

  // The glowing sky pane (unlit so it always reads as bright daylight).
  const pane = new Mesh(
    new PlaneGeometry(WINDOW_WIDTH, WINDOW_HEIGHT),
    new MeshBasicMaterial({ map: makeWindowSkyTexture() }),
  );
  pane.rotation.y = -Math.PI / 2; // face into the room (toward -x)
  pane.position.set(faceX + intoRoom * 0.01, WINDOW_CENTER_Y, WINDOW_CENTER_Z);
  group.add(pane);

  const t = WINDOW_FRAME_THICKNESS;
  const halfWdt = WINDOW_WIDTH / 2;
  const halfHgt = WINDOW_HEIGHT / 2;
  // Frame bars (top, bottom, then left/right along z).
  const bar = (h: number, zLen: number, y: number, z: number): Mesh => {
    const m = new Mesh(new BoxGeometry(WINDOW_FRAME_DEPTH, h, zLen), frameMat);
    m.position.set(frameX, y, z);
    m.castShadow = true;
    return m;
  };
  group.add(bar(t, WINDOW_WIDTH + 2 * t, WINDOW_CENTER_Y + halfHgt + t / 2, WINDOW_CENTER_Z));
  group.add(bar(t, WINDOW_WIDTH + 2 * t, WINDOW_CENTER_Y - halfHgt - t / 2, WINDOW_CENTER_Z));
  group.add(bar(WINDOW_HEIGHT, t, WINDOW_CENTER_Y, WINDOW_CENTER_Z - halfWdt - t / 2));
  group.add(bar(WINDOW_HEIGHT, t, WINDOW_CENTER_Y, WINDOW_CENTER_Z + halfWdt + t / 2));
  // Muntins: a slim cross over the glass.
  const muntinV = new Mesh(new BoxGeometry(WINDOW_FRAME_DEPTH * 0.7, WINDOW_HEIGHT, t * 0.5), frameMat);
  muntinV.position.set(frameX, WINDOW_CENTER_Y, WINDOW_CENTER_Z);
  group.add(muntinV);
  const muntinH = new Mesh(new BoxGeometry(WINDOW_FRAME_DEPTH * 0.7, t * 0.5, WINDOW_WIDTH), frameMat);
  muntinH.position.set(frameX, WINDOW_CENTER_Y, WINDOW_CENTER_Z);
  group.add(muntinH);
  // The sill, a little shelf sticking into the room.
  const sill = new Mesh(
    new BoxGeometry(WINDOW_SILL_DEPTH, WINDOW_SILL_HEIGHT, WINDOW_WIDTH + 2 * t + 0.06),
    frameMat,
  );
  sill.position.set(
    faceX + intoRoom * (WINDOW_SILL_DEPTH / 2),
    WINDOW_CENTER_Y - halfHgt - t - WINDOW_SILL_HEIGHT / 2,
    WINDOW_CENTER_Z,
  );
  sill.castShadow = true;
  sill.receiveShadow = true;
  group.add(sill);
  world.createTransformEntity(group);

  // Soft daylight spilling in from the window (no shadow, so it stays cheap).
  const sun = new PointLight(new Color(WINDOW_LIGHT_COLOR), WINDOW_LIGHT_INTENSITY, WINDOW_LIGHT_DISTANCE);
  sun.position.set(faceX + intoRoom * 0.4, WINDOW_CENTER_Y, WINDOW_CENTER_Z);
  world.scene.add(sun);
}

// A cozy bookshelf against the left wall, with a few cheerful books on it.
function buildBookshelf(world: World): void {
  const group = new Group();
  const centerX = SHELF_X + SHELF_DEPTH / 2;
  const woodMat = new MeshStandardMaterial({ color: new Color(WOOD_PROP_COLOR), roughness: SURFACE_ROUGHNESS });
  const part = (w: number, h: number, d: number, x: number, y: number, z: number): Mesh => {
    const m = new Mesh(new BoxGeometry(w, h, d), woodMat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };
  // Back and two side panels.
  group.add(part(0.03, SHELF_HEIGHT, SHELF_WIDTH, SHELF_X, SHELF_HEIGHT / 2, SHELF_Z));
  group.add(part(SHELF_DEPTH, SHELF_HEIGHT, 0.03, centerX, SHELF_HEIGHT / 2, SHELF_Z - SHELF_WIDTH / 2));
  group.add(part(SHELF_DEPTH, SHELF_HEIGHT, 0.03, centerX, SHELF_HEIGHT / 2, SHELF_Z + SHELF_WIDTH / 2));
  // Shelf boards, dividing the unit into levels, and books on each level.
  for (let i = 0; i <= SHELF_LEVELS; i++) {
    const boardY = (i * SHELF_HEIGHT) / SHELF_LEVELS;
    group.add(part(SHELF_DEPTH, SHELF_BOARD_THICKNESS, SHELF_WIDTH, centerX, boardY, SHELF_Z));
    if (i === SHELF_LEVELS) continue;
    const levelGap = SHELF_HEIGHT / SHELF_LEVELS;
    let z = SHELF_Z - SHELF_WIDTH / 2 + 0.07;
    let b = i;
    while (z < SHELF_Z + SHELF_WIDTH / 2 - 0.07) {
      const bookH = levelGap * lerp(0.62, 0.86, ((b * 7) % 5) / 5);
      const bookMat = new MeshStandardMaterial({
        color: new Color(BOOK_COLORS[b % BOOK_COLORS.length]),
        roughness: SURFACE_ROUGHNESS,
      });
      const book = new Mesh(new BoxGeometry(SHELF_DEPTH * 0.7, bookH, SHELF_BOOK_W), bookMat);
      book.position.set(centerX + 0.02, boardY + SHELF_BOARD_THICKNESS / 2 + bookH / 2, z);
      book.castShadow = true;
      group.add(book);
      z += SHELF_BOOK_W + SHELF_BOOK_GAP;
      b++;
    }
  }
  world.createTransformEntity(group);
}

// A friendly potted plant for a back corner: a terracotta pot with leaf blades.
function buildPlant(world: World): void {
  const group = new Group();
  const pot = new Mesh(
    new CylinderGeometry(PLANT_POT_RADIUS, PLANT_POT_RADIUS * 0.8, PLANT_POT_HEIGHT, 20),
    new MeshStandardMaterial({ color: new Color(PLANT_POT_COLOR), roughness: SURFACE_ROUGHNESS }),
  );
  pot.position.set(PLANT_X, PLANT_POT_HEIGHT / 2, PLANT_Z);
  pot.castShadow = true;
  pot.receiveShadow = true;
  group.add(pot);
  for (let i = 0; i < PLANT_LEAF_COUNT; i++) {
    const leafMat = new MeshStandardMaterial({
      color: new Color(i % 2 === 0 ? PLANT_LEAF_COLOR : PLANT_LEAF_DARK),
      roughness: SURFACE_ROUGHNESS,
    });
    const leaf = new Mesh(new ConeGeometry(0.05, PLANT_LEAF_HEIGHT, 8), leafMat);
    const angle = (i / PLANT_LEAF_COUNT) * Math.PI * 2;
    leaf.position.set(
      PLANT_X + Math.cos(angle) * 0.06,
      PLANT_POT_HEIGHT + PLANT_LEAF_HEIGHT * 0.35,
      PLANT_Z + Math.sin(angle) * 0.06,
    );
    leaf.rotation.z = Math.cos(angle) * 0.35;
    leaf.rotation.x = -Math.sin(angle) * 0.35;
    leaf.castShadow = true;
    group.add(leaf);
  }
  world.createTransformEntity(group);
}

// A small framed picture on the left wall, above the bookshelf.
function buildWallArt(world: World): void {
  const group = new Group();
  const faceX = -ROOM_WIDTH / 2 + WALL_THICKNESS / 2; // inner face of the left wall
  const frameX = faceX + ART_DEPTH / 2;
  const frame = new Mesh(
    new BoxGeometry(ART_DEPTH, ART_HEIGHT + ART_FRAME_BORDER * 2, ART_WIDTH + ART_FRAME_BORDER * 2),
    new MeshStandardMaterial({ color: new Color(ART_FRAME_COLOR), roughness: SURFACE_ROUGHNESS }),
  );
  frame.position.set(frameX, ART_Y, ART_Z);
  frame.castShadow = true;
  group.add(frame);
  const picture = new Mesh(
    new BoxGeometry(ART_DEPTH * 0.6, ART_HEIGHT, ART_WIDTH),
    new MeshStandardMaterial({ color: new Color(ART_PICTURE_COLOR), roughness: SURFACE_ROUGHNESS }),
  );
  picture.position.set(frameX + ART_DEPTH * 0.4, ART_Y, ART_Z);
  group.add(picture);
  world.createTransformEntity(group);
}

// Build the whole grounded room in one call: wood floor, four trimmed walls, a
// ceiling, the rug, the daylight window, and the cozy props. The floor carries
// LocomotionEnvironment so the player never falls through it.
function buildRoomEnvironment(world: World): void {
  const halfW = ROOM_WIDTH / 2;
  const halfD = ROOM_DEPTH / 2;

  // Floor: warm wood planks you can walk on.
  const floor = new Mesh(
    new PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH),
    new MeshStandardMaterial({ map: makeWoodFloorTexture(), roughness: 0.8 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  world
    .createTransformEntity(floor)
    .addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC });

  // Ceiling: a soft warm white lid so the room feels enclosed and real.
  const ceiling = new Mesh(
    new PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH),
    new MeshStandardMaterial({ color: new Color(CEILING_COLOR), roughness: 1, side: DoubleSide }),
  );
  ceiling.rotation.x = Math.PI / 2; // face down into the room
  ceiling.position.y = WALL_HEIGHT;
  world.createTransformEntity(ceiling);

  // Four painted walls with wainscot and trim.
  const wallMats = {
    paint: new MeshStandardMaterial({ color: new Color(WALL_PAINT_COLOR), roughness: SURFACE_ROUGHNESS }),
    wainscot: new MeshStandardMaterial({ color: new Color(WALL_WAINSCOT_COLOR), roughness: SURFACE_ROUGHNESS }),
    trim: new MeshStandardMaterial({ color: new Color(WALL_TRIM_COLOR), roughness: SURFACE_ROUGHNESS }),
  };
  buildWall(world, 'z', 1, ROOM_WIDTH, 0, -halfD, wallMats); // back wall
  buildWall(world, 'z', -1, ROOM_WIDTH, 0, halfD, wallMats); // front wall (behind you)
  buildWall(world, 'x', 1, ROOM_DEPTH, -halfW, 0, wallMats); // left wall
  buildWall(world, 'x', -1, ROOM_DEPTH, halfW, 0, wallMats); // right wall

  buildRug(world);
  buildWindow(world, halfW);
  buildBookshelf(world);
  buildPlant(world);
  buildWallArt(world);

  // Warm image-based ambient fill so the lit materials read as a real, sunlit
  // room rather than flat color. Subtle on top of the existing key and fill.
  const levelRoot = world.activeLevel.value;
  levelRoot.addComponent(IBLGradient, {
    sky: rgba01(IBL_SKY_COLOR),
    equator: rgba01(IBL_EQUATOR_COLOR),
    ground: rgba01(IBL_GROUND_COLOR),
    intensity: IBL_INTENSITY,
  });
  levelRoot.setValue(IBLGradient, '_needsUpdate', true);
}

// ============================================================
// TITLE SCREEN (game-shell polish)
// A friendly start screen shown before onboarding: a big title banner, a
// tagline, a chunky Play button, and a few gold coins bobbing around it. Press
// Play and onboarding begins. Reuses the same screen lifecycle as the guide
// bubbles (onboardingScreen + teardownScreen + the GuideSystem hover glow), so
// the laptop pointer fix and the microtask creation rule apply here too.
// ============================================================

// A gentle, self-rearming bob for a floating object. Animator.cancelFor(obj)
// (called by teardownScreen when the title is dismissed) stops it cleanly.
function bobFloat(obj: Object3D, baseY: number, amp: number, speed: number, phase: number): void {
  const dur = (Math.PI * 2) / speed;
  Animator.run(
    dur,
    (p) => {
      obj.position.y = baseY + Math.sin(phase + p * Math.PI * 2) * amp;
      obj.rotation.y = phase + p * Math.PI * 2;
    },
    { target: obj, onComplete: () => bobFloat(obj, baseY, amp, speed, phase) },
  );
}

function showTitleScreen(world: World): void {
  teardownScreen();
  const entities: Entity[] = [];

  // A warm rounded title card behind everything, so the title reads as its own
  // welcome poster and the wall scoreboard does not show through.
  const card = createLabel('', {
    canvasW: Math.round((512 * TITLE_CARD_W) / TITLE_CARD_H),
    canvasH: 512,
    height: TITLE_CARD_H,
    bg: TITLE_CARD_COLOR,
    border: TITLE_CARD_FRAME,
  });
  const cardGroup = new Group();
  cardGroup.add(card.mesh);
  cardGroup.position.set(0, TITLE_CARD_Y, TITLE_Z - 0.05);
  entities.push(world.createTransformEntity(cardGroup));
  cardGroup.scale.setScalar(0.01);
  Animator.run(TITLE_POP_TIME, (p) => cardGroup.scale.setScalar(lerp(0.01, 1, easeOutBack(p))), {
    target: cardGroup,
  });

  // Title banner: big, bold, on a coral plate with a cream outline.
  const banner = createLabel(TITLE_TEXT, {
    canvasW: 1024,
    canvasH: 300,
    height: TITLE_BANNER_H,
    bg: CORAL,
    ink: '#FFFFFF',
    bold: true,
    border: WALL_TRIM_COLOR,
  });
  banner.mesh.position.set(0, TITLE_BANNER_Y, TITLE_Z);
  const bannerGroup = new Group();
  bannerGroup.add(banner.mesh);
  const bannerEntity = world.createTransformEntity(bannerGroup);
  entities.push(bannerEntity);

  // Tagline and hint, in friendly dark text on cream cards.
  const tagline = createLabel(TITLE_TAGLINE, {
    canvasW: 1024,
    canvasH: 150,
    height: TITLE_TAGLINE_H,
    bold: false,
    border: GUIDE_BUBBLE_BORDER,
  });
  tagline.mesh.position.set(0, TITLE_TAGLINE_Y, TITLE_Z);
  entities.push(world.createTransformEntity(tagline.mesh));

  const hint = createLabel(TITLE_HINT, {
    canvasW: 768,
    canvasH: 96,
    height: TITLE_HINT_H,
    bold: false,
  });
  hint.mesh.position.set(0, TITLE_HINT_Y, TITLE_Z);
  entities.push(world.createTransformEntity(hint.mesh));

  // The chunky Play button.
  const playMat = new MeshStandardMaterial({
    color: new Color(GROWTH_GREEN),
    roughness: SURFACE_ROUGHNESS,
    emissive: new Color(GROWTH_GREEN),
    emissiveIntensity: 0.22,
  });
  const playMesh = new Mesh(new BoxGeometry(TITLE_PLAY_W, TITLE_PLAY_H, TITLE_PLAY_D), playMat);
  playMesh.position.set(0, TITLE_PLAY_Y, TITLE_Z);
  playMesh.castShadow = true;
  const playFace = createLabel('Play', { canvasW: 256, canvasH: 128, height: TITLE_PLAY_H * 0.6 });
  playFace.mesh.position.set(0, 0, TITLE_PLAY_D / 2 + 0.003);
  playMesh.add(playFace.mesh);
  const playEntity = world.createTransformEntity(playMesh).addComponent(RayInteractable);
  entities.push(playEntity);
  guideGlowers.push({ entity: playEntity, mat: playMat, glow: 0 });
  (playMesh as any).addEventListener('pointerdown', () => {
    Animator.squash(playMesh);
    Sound.click();
  });
  (playMesh as any).addEventListener('click', () => {
    Sound.chime();
    spawnBurst(world, new Vector3(0, TITLE_BANNER_Y, TITLE_Z), TITLE_BURST_COUNT);
    setBoardVisible(true); // the scoreboard joins the room as the game begins
    teardownScreen();
    queueMicrotask(() => startOnboarding(world));
  });

  // A few gold coins bobbing in a ring around the title.
  const coinMat = new MeshStandardMaterial({
    color: new Color(MONEY_GOLD),
    roughness: 0.4,
    metalness: 0.3,
  });
  for (let i = 0; i < TITLE_COIN_COUNT; i++) {
    const angle = (i / TITLE_COIN_COUNT) * Math.PI * 2;
    const coin = new Mesh(
      new CylinderGeometry(TITLE_COIN_RADIUS, TITLE_COIN_RADIUS, TITLE_COIN_RADIUS * 0.4, 24),
      coinMat,
    );
    coin.rotation.x = Math.PI / 2;
    const baseY = TITLE_CARD_Y + Math.sin(angle) * TITLE_COIN_RING_Y;
    coin.position.set(Math.cos(angle) * TITLE_COIN_RING, baseY, TITLE_Z + 0.05);
    const coinEntity = world.createTransformEntity(coin);
    entities.push(coinEntity);
    bobFloat(coin, baseY, TITLE_COIN_BOB_AMP, TITLE_COIN_BOB_SPEED, angle);
  }

  // Pop the title in and give a soft chime so it feels alive.
  bannerGroup.scale.setScalar(0.01);
  Animator.run(TITLE_POP_TIME, (p) => bannerGroup.scale.setScalar(lerp(0.01, 1, easeOutBack(p))), {
    target: bannerGroup,
  });
  Sound.blip();

  onboardingScreen = entities;
  refreshFlatPointer(world);
}

// ============================================================
// PROGRESS SIGN (game-shell polish)
// A small sign on the back wall, above the scoreboard, showing the three life
// stages as chips. The chip for the stage you are in glows and grows; finished
// stages turn green; stages still ahead stay muted. It is built once (hidden)
// and revealed when Stage 1 begins; GuideSystem repaints it whenever the stage
// changes (see updateProgressHud). It only reads game.stage, never writes it.
// ============================================================

function buildProgressHud(world: World): void {
  const group = new Group();
  const chips: { mat: MeshStandardMaterial; mesh: Mesh }[] = [];
  const halfD = ROOM_DEPTH / 2;
  const z = -halfD + WALL_THICKNESS + 0.04; // just in front of the back wall

  // A slim rail joining the chips so they read as one progress track.
  const railMat = new MeshStandardMaterial({ color: new Color(HUD_UPCOMING_COLOR), roughness: SURFACE_ROUGHNESS });
  const rail = new Mesh(new BoxGeometry(HUD_CHIP_PITCH * 2, HUD_CONNECTOR_H, HUD_CHIP_D * 0.6), railMat);
  rail.position.set(0, HUD_Y, z - 0.01);
  group.add(rail);

  for (let i = 0; i < HUD_STAGE_LABELS.length; i++) {
    const mat = new MeshStandardMaterial({
      color: new Color(HUD_UPCOMING_COLOR),
      roughness: SURFACE_ROUGHNESS,
      emissive: new Color(HUD_ACTIVE_COLOR),
      emissiveIntensity: 0,
    });
    const x = (i - 1) * HUD_CHIP_PITCH;
    const chip = new Mesh(new BoxGeometry(HUD_CHIP_W, HUD_CHIP_H, HUD_CHIP_D), mat);
    chip.position.set(x, HUD_Y, z);
    chip.castShadow = true;
    const label = createLabel(HUD_STAGE_LABELS[i], { canvasW: 384, canvasH: 150, height: HUD_LABEL_H });
    label.mesh.position.set(0, 0, HUD_CHIP_D / 2 + 0.003);
    chip.add(label.mesh);
    group.add(chip);
    chips.push({ mat, mesh: chip });
  }

  group.visible = false;
  world.createTransformEntity(group, { persistent: true });
  progressHud = { group, chips, shown: -1 };
}

// Repaint the progress sign for the given stage: finished stages green, the
// current stage lit coral and grown, stages still ahead muted. Stage 0 (title
// and onboarding) keeps the sign hidden.
function updateProgressHud(stage: number): void {
  if (!progressHud) return;
  const firstReveal = progressHud.shown < 1 && stage >= 1;
  progressHud.shown = stage;
  if (stage < 1) {
    progressHud.group.visible = false;
    return;
  }
  progressHud.group.visible = true;
  progressHud.chips.forEach((chip, i) => {
    const stageNum = i + 1; // chips are Stage 1, 2, 3
    const isActive = stageNum === stage;
    const isDone = stageNum < stage;
    chip.mat.color.set(isActive ? HUD_ACTIVE_COLOR : isDone ? HUD_DONE_COLOR : HUD_UPCOMING_COLOR);
    chip.mat.emissiveIntensity = isActive ? HUD_ACTIVE_EMISSIVE : 0;
    const target = isActive ? HUD_ACTIVE_SCALE : 1;
    Animator.cancelFor(chip.mesh);
    const start = chip.mesh.scale.x;
    Animator.run(SQUASH_TIME, (p) => chip.mesh.scale.setScalar(lerp(start, target, easeOutBack(p))), {
      target: chip.mesh,
    });
  });
  if (firstReveal) {
    progressHud.group.scale.setScalar(0.01);
    Animator.run(HUD_REVEAL_TIME, (p) => progressHud!.group.scale.setScalar(lerp(0.01, 1, easeOutBack(p))), {
      target: progressHud.group,
    });
  }
}

// ============================================================
// WORLD - the 3D room, the cross-platform player, and the scoreboard
// ============================================================
World.create(document.getElementById('scene-container') as HTMLDivElement, {
  assets: {},
  // Headset settings. Offer "Enter VR" everywhere; ask for hand tracking and
  // layers as optional so the session still launches on the emulator.
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    offer: 'always',
    features: { handTracking: true, layers: true },
  },
  // Engine features. browserControls turns on first-person browser movement so
  // the laptop preview matches the headset; the floor below carries
  // LocomotionEnvironment so you never fall through it. No grab and no physics:
  // later steps use pointer and ray selection, never grab and carry.
  features: {
    locomotion: { useWorker: true, browserControls: true },
    grabbing: false,
    physics: false,
    sceneUnderstanding: false,
    environmentRaycast: false,
  },
}).then((world) => {
  const { camera } = world;

  // Where you stand and look when the browser preview opens. In the headset the
  // real head pose takes over; on the laptop you look around with the mouse
  // (the emulator overlay owns mouse-look) and move with WASD.
  camera.position.set(0, EYE_HEIGHT, PLAYER_START_Z);
  camera.rotateX(VIEW_TILT);

  // ---- Renderer: filmic tone mapping, correct colors, soft shadows ----
  // This is the Module 6 look: properly lit materials in a tone-mapped pipeline,
  // not flat unlit surfaces.
  const renderer = world.renderer;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = EXPOSURE;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  // ---- Lights: a soft ambient fill plus one gentle key light ----
  const fillLight = new HemisphereLight(
    new Color(HEMI_SKY_COLOR),
    new Color(HEMI_GROUND_COLOR),
    HEMI_INTENSITY,
  );
  world.scene.add(fillLight);

  const keyLight = new DirectionalLight(new Color(KEY_COLOR), KEY_INTENSITY);
  keyLight.position.set(KEY_POSITION[0], KEY_POSITION[1], KEY_POSITION[2]);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 40;
  keyLight.shadow.camera.left = -SHADOW_EXTENT;
  keyLight.shadow.camera.right = SHADOW_EXTENT;
  keyLight.shadow.camera.top = SHADOW_EXTENT;
  keyLight.shadow.camera.bottom = -SHADOW_EXTENT;
  keyLight.shadow.bias = -0.0004;
  keyLight.shadow.normalBias = 0.02;
  world.scene.add(keyLight);
  world.scene.add(keyLight.target);

  // ---- Sky: a soft cheerful gradient dome ----
  const levelRoot = world.activeLevel.value;
  levelRoot.addComponent(DomeGradient, {
    sky: rgba01(SKY_TOP_COLOR),
    equator: rgba01(SKY_BLUE),
    ground: rgba01(PANEL_CREAM),
    intensity: SKY_INTENSITY,
  });
  levelRoot.setValue(DomeGradient, '_needsUpdate', true);

  // ---- Room shell: the grounded, cozy room (a wood floor, painted walls with
  // wainscot and trim, a ceiling, a daylight window, a rug, and warm props) ----
  const halfW = ROOM_WIDTH / 2;
  const halfD = ROOM_DEPTH / 2;
  buildRoomEnvironment(world);

  // ---- Desk: a chunky wooden desk tucked into the back-left corner ----
  const desk = new Group();
  const deskMaterial = new MeshStandardMaterial({
    color: new Color(WOOD_PROP_COLOR),
    roughness: SURFACE_ROUGHNESS,
  });

  const legHeight = DESK_HEIGHT - DESK_TOP_THICKNESS;
  const deskTop = new Mesh(
    new BoxGeometry(DESK_WIDTH, DESK_TOP_THICKNESS, DESK_DEPTH),
    deskMaterial,
  );
  deskTop.position.set(0, DESK_HEIGHT - DESK_TOP_THICKNESS / 2, 0);
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  desk.add(deskTop);

  const legInsetX = DESK_WIDTH / 2 - DESK_LEG_RADIUS * 2;
  const legInsetZ = DESK_DEPTH / 2 - DESK_LEG_RADIUS * 2;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    const leg = new Mesh(
      new CylinderGeometry(DESK_LEG_RADIUS, DESK_LEG_RADIUS, legHeight, 12),
      deskMaterial,
    );
    leg.position.set(sx * legInsetX, legHeight / 2, sz * legInsetZ);
    leg.castShadow = true;
    desk.add(leg);
  }
  desk.position.set(
    -halfW + DESK_WIDTH / 2 + DESK_MARGIN,
    0,
    -halfD + DESK_DEPTH / 2 + DESK_MARGIN,
  );
  world.createTransformEntity(desk);

  // ---- Scoreboard: a real 3D sign on the back wall (not pinned to your view) ----
  const frameZ = -halfD + WALL_THICKNESS / 2 + SCOREBOARD_FRAME_DEPTH / 2;

  const frame = new Mesh(
    new BoxGeometry(
      SCOREBOARD_WIDTH + SCOREBOARD_FRAME_PAD * 2,
      SCOREBOARD_HEIGHT + SCOREBOARD_FRAME_PAD * 2,
      SCOREBOARD_FRAME_DEPTH,
    ),
    new MeshStandardMaterial({ color: new Color(CORAL), roughness: SURFACE_ROUGHNESS }),
  );
  frame.position.set(0, SCOREBOARD_Y, frameZ);
  frame.castShadow = true;
  frame.receiveShadow = true;
  world.createTransformEntity(frame);
  boardParts.push(frame);

  // Little gold corner bolts so the sign reads as a friendly toy object.
  const boltMaterial = new MeshStandardMaterial({
    color: new Color(MONEY_GOLD),
    roughness: SURFACE_ROUGHNESS,
  });
  const boltX = SCOREBOARD_WIDTH / 2 + SCOREBOARD_FRAME_PAD / 2;
  const boltY = SCOREBOARD_HEIGHT / 2 + SCOREBOARD_FRAME_PAD / 2;
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    const bolt = new Mesh(new SphereGeometry(BOLT_RADIUS, 16, 16), boltMaterial);
    bolt.position.set(sx * boltX, SCOREBOARD_Y + sy * boltY, frameZ + SCOREBOARD_FRAME_DEPTH / 2);
    world.createTransformEntity(bolt);
    boardParts.push(bolt);
  }

  // The live scoreboard panel sits just in front of the frame face. With no
  // ScreenSpace component it renders in world space, so it stays on the wall in
  // both the headset and the laptop preview.
  const board = world.createTransformEntity().addComponent(PanelUI, {
    config: SCOREBOARD_CONFIG,
    maxWidth: SCOREBOARD_WIDTH,
    maxHeight: SCOREBOARD_HEIGHT,
  });
  board.object3D!.position.set(
    0,
    SCOREBOARD_Y,
    frameZ + SCOREBOARD_FRAME_DEPTH / 2 + PANEL_FACE_OFFSET,
  );
  if (board.object3D) boardParts.push(board.object3D);

  // The title screen is a full welcome, so hide the board until Play is pressed.
  // Penny reveals and points at it once onboarding begins.
  setBoardVisible(false);

  // ---- Progress sign: the three life stages, on the wall above the board ----
  // Built hidden; it pops in when Stage 1 begins and tracks the current stage.
  buildProgressHud(world);

  // ---- Systems ----
  world.registerSystem(DashboardSystem);
  world.registerSystem(AnimationSystem);
  world.registerSystem(MoneyRoundSystem);
  world.registerSystem(RoomFeedbackSystem);
  world.registerSystem(GuideSystem);

  // ---- Sound and the speaker button (Step 1B) ----
  // Build the music bed and arm the first-interaction unlock, then stand the
  // speaker (mute) button in the room. The music only starts once you click or
  // press a trigger; until then the scene is silent on purpose.
  Sound.init(world);
  buildSpeakerButton(world);

  // Keep mouse clicks landing on freshly built buttons (see refreshFlatPointer).
  trackFlatPointer(world);

  // ---- Title screen, then onboarding ----
  // A friendly start screen welcomes the player. Pressing Play hands off to
  // onboarding (Penny greets you, you pick a look, she teaches the three meters
  // and the three life stages, you practice with the real jars), and then
  // Stage 1 begins.
  showTitleScreen(world);
});
