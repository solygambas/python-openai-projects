total_duration=0
for file in ./*.mp4; do
    if [ -f "$file" ]; then
        echo "File: $file"
        duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$file" 2>/dev/null)
        total_duration=$(echo "$total_duration + $duration" | bc)
    fi
done

# Calculate minutes, seconds, and fractional seconds separately
total_minutes=$(bc <<< "scale=0; $total_duration / 60")
total_seconds=$(bc <<< "scale=0; $total_duration % 60")
total_fractional_seconds=$(bc <<< "scale=6; $total_duration - ($total_minutes * 60) - $total_seconds")

echo "Total Duration: $total_minutes minutes $total_seconds seconds $total_fractional_seconds seconds"

