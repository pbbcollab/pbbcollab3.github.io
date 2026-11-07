# PBB Collab 3.0 Ranker

Fan ranker for **Pinoy Big Brother: Collab 3.0** housemates — pick your Kapamilya and Kapuso Big 4.

## Features

- Search housemates
- Filters: Kapuso Housemates, Kapamilya Housemates, Nominated, Evicted, With Immunity, Safe
- Drag-and-drop ranking within each Big 4 pyramid
- Shareable ranking links

## Status codes in `housemate_info.csv`

| Code | Meaning |
|------|---------|
| `s`  | Safe |
| `n`  | Nominated |
| `e`  | Evicted |
| `i`  | With Immunity |

Agency color: `A` = Kapamilya, `B` = Kapuso.

## Local preview

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000`.
