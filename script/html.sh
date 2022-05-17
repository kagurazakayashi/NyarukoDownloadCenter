cp src/nyalib/UI/datepicker/datepicker.template.html html/
cp src/nyalib/UI/datepicker/datepicker.template.css css/
python3 src/nyalib/Tools/nyacss.py css src
mv src/*.css dist/
cp html/*.html dist/
mv dist/index.html ./index.html
rm html/datepicker.template.html
rm css/datepicker.template.css