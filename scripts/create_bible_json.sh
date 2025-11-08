#!/bin/bash

# This script downloads the World English Bible in JSON format from a GitHub repository,
# processes each book, and combines them into a single JSON file.

set -e

BASE_URL="https://raw.githubusercontent.com/aruljohn/Bible-kjv/master"
OUTPUT_FILE="bible_kjv.json"
BOOKS=(
    "Genesis" "Exodus" "Leviticus" "Numbers" "Deuteronomy" "Joshua" "Judges" "Ruth" "1Samuel" "2Samuel"
    "1Kings" "2Kings" "1Chronicles" "2Chronicles" "Ezra" "Nehemiah" "Esther" "Job" "Psalms" "Proverbs"
    "Ecclesiastes" "SongofSolomon" "Isaiah" "Jeremiah" "Lamentations" "Ezekiel" "Daniel" "Hosea" "Joel"
    "Amos" "Obadiah" "Jonah" "Micah" "Nahum" "Habakkuk" "Zephaniah" "Haggai" "Zechariah" "Malachi"
    "Matthew" "Mark" "Luke" "John" "Acts" "Romans" "1Corinthians" "2Corinthians" "Galatians" "Ephesians"
    "Philippians" "Colossians" "1Thessalonians" "2Thessalonians" "1Timothy" "2Timothy" "Titus" "Philemon"
    "Hebrews" "James" "1Peter" "2Peter" "1John" "2John" "3John" "Jude" "Revelation"
)

# Start with a clean file and an opening bracket for the JSON array
echo "[" > $OUTPUT_FILE

FIRST_BOOK=true

for book in "${BOOKS[@]}"; do
    echo "Processing $book..."
    URL="$BASE_URL/$book.json"

    # Fetch the book data and process it with jq
    # The jq filter transforms the original structure to the desired format
    # Original: { "book": "...", "chapters": [ [ { "verse": 1, "text": "..." } ] ] }
    # Target: [ { "book": "...", "chapter": ..., "verse": ..., "text": "..." } ]
    PROCESSED_JSON=$(curl -s $URL | jq -c --arg book_name "$book" '
        .chapters | map(
            .chapter as $chapter_num | .verses | map(
                {
                    book: $book_name,
                    chapter: ($chapter_num | tonumber),
                    verse: (.verse | tonumber),
                    text: .text
                }
            )
        ) | flatten
    ')

    # Remove the outer brackets from the processed JSON for each book
    STRIPPED_JSON=$(echo "$PROCESSED_JSON" | sed 's/^\[//' | sed 's/\]$//')

    # Append to the main file, adding a comma if it's not the first book
    if [ -n "$STRIPPED_JSON" ]; then
        if [ "$FIRST_BOOK" = true ]; then
            FIRST_BOOK=false
        else
            echo "," >> $OUTPUT_FILE
        fi
        echo "$STRIPPED_JSON" >> $OUTPUT_FILE
    fi
done

# Add the closing bracket
echo "]" >> $OUTPUT_FILE

echo "Bible processing complete. Output saved to $OUTPUT_FILE"
