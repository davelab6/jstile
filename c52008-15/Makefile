.SUFFIXES:
.SUFFIXES: .tex .png .eps

base = c52008-ohshima
texsource = abstract.tex c52008-ohshima.tex conclusions.tex discussion.tex evaluator.tex intro.tex js.tex tiles.tex
pngfiles = etoystiles.png hypowhile.png realwhile.png sum.png turtle.png
epsfiles = $(subst .png,.eps,$(pngfiles))

convert = "c:/Program Files/ImageMagick-6.0.1-Q16/convert"
intermediate = .aux .bbl .blg .log .dvi

${base}.dvi: ${texsource} ${base}.bbl ${epsfiles}
	platex ${base}.tex
	platex ${base}.tex

${base}.aux: ${texsource} ${epsfiles}
	platex ${base}.tex

${base}.bbl: sts.bib ${base}.aux
	bibtex ${base}

${base}.pdf: ${base}.dvi
	dvipdfmx -f dlbase14 ${base}

pictures: ${epsfiles}

pdf: ${base}.pdf

once::
	platex ${base}.tex

clean:
	rm -f ${epsfiles}
	rm -f $(subst .eps,.pbm,$(epsfiles))
	rm -f $(addprefix $(base), $(intermediate))
	rm -f *~

# rm -f ${base}.pdf

$(epsfiles): %.eps: %.png
	${convert} $< $@

