import Lexer from './lexer/lexer'
import Bibliography from './../bibliography/Bibliography'
import grammar from './parser/parser';
import nearley from 'nearley';
/**
 * From Taming the BeaST: http://ctan.cs.uu.nl/info/bibtex/tamethebeast/ttb_en.pdf
 *
 <dl>

 <dt>address</dt>
 <dd>Generally the city or complete address of the publisher.
 </dd>

 <dt>author</dt>
 <dd>For author names. The input format is quite special, since BibTEX has to be
 able to distinguish between the first and last names. Section 11 and 18 are
 completely dedicated to this topic.
 </dd>

 <dt>booktitle</dt>
 <dd>For the title of a book one part of which is cited.
 </dd>

 <dt>chapter</dt>
 <dd>The number of the chapter (or any part) of a book being cited. If not a chapter,
 the type field might be used for precising the type of sectioning.
 </dd>

 <dt>crossref</dt>
 <dd>This one is quite peculiar. It’s used to cross-reference within the bibliography.
 For instance, you might cite a document, and a part of it. In that case, the
 second one can reference the first one, or at least inherit some of its fields from
 the first one. This deserves some more comments, see section 12.
 </dd>

 <dt>edition</dt>
 <dd>The edition number. Or in fact its ordinal, for instance edition = "First".
 This might raise problems when trying to export a bibliography into another
 language.
 </dd>

 <dt>editor</dt>
 <dd>The name of the editor(s) of the entry. The format is the same as for authors.
 </dd>

 <dt>howpublished</dt>
 <dd>Only used in rare cases where the document being cited is not a classical type
 such as a @book, an @article or an @inproceedings publication.
 </dd>

 <dt>institution</dt>
 <dd>For a technical report, the name of the institution that published it.
 </dd>

 <dt>journal</dt>
 <dd>The name of the journal in which the cited article has been published.
 key Used for defining the label, in case it cannot be computed by BibTEX. It does
 not force the label, but defines the label when BibTEX needs one but can’t
 compute it.
 </dd>

 <dt>month</dt>
 <dd>Well... The month during which the document has been published. This also
 raises the problem of the translation of the bibliography: It’s better having
 a numerical value, or an abbreviation, instead of the complete name of the
 month. Having the number would also allow BibTEX to sort the entries more
 precisely (even though, as far as I know, no bibliography style does this at the
 present time).
 </dd>

 <dt>note</dt>
 <dd>For any additional data you would want to add. Since classical styles were
 written in 1985, they don’t have a url field, and note is often used for this
 purpose, together with the url.sty package.</dd>

 <dt>number</dt>
 <dd>A number... Not whichever, but the number of a report. For volume numbers,
 a special volume field exists.
 organization The organizing institution of a conference.
 </dd>

 <dt>pages</dt>
 <dd>The relevant pages of the document. Useful for the reader when you cite a huge
 book; Note that such a precision could be added through the optional argument
 of \cite (see page 6), in which case it would appear in the document but not
 in the bibliography.
 </dd>

 <dt>publisher</dt>
 <dd>The institution that published the document.
 </dd>

 <dt>school</dt>
 <dd>For theses, the name of the school the thesis has been prepared in.
 </dd>

 <dt>series</dt>
 <dd>The name of a collection of series or books.
 </dd>

 <dt>title</dt>
 <dd>The title of the document being cited. There are some rules to be observed
 when entering this field, see section 10.
 </dd>

 <dt>type</dt>
 <dd>The type. Which type? It depends... The type of publication, if needed. For
 </dd>

 <dt>thesi</dt>
 <dd>s, for instance, in order to distinguish between a masters thesis and a PhD.
 Or the type of section being cited (see chapter above).
 </dd>

 <dt>volume</dt>
 <dd>The volume number in a series or collection of books.
 </dd>

 <dt>year</dt>
 <dd>The publication year.</dd>

 </dl>
 **/
const address = 'address';
const author = 'author';
const booktitle = 'booktitle';
const chapter = 'chapter';
const edition = 'edition';
const editor = 'editor';
const howpublished = 'howpublished';
const institution = 'institution';
const journal = 'journal';
const month = 'month';
const note = 'note';
const number = 'number';
const organization = 'organization';
const pages = 'pages';
const publisher = 'publisher';
const school = 'school';
const series = 'series';
const title = 'title';
const type = 'type';
const volume = 'volume';
const year = 'year';

const optionalFields = {
  'book': [[volume, number], series, address, edition, month, note],
  'booklet': [author, howpublished, address, address, month, year, note],
  'conference': [editor, [volume, number], series, pages, address, month, organization, publisher, note],
  'inproceedings': [editor, [volume, number], series, pages, address, month, organization, publisher, note],
  'inbook': [volume, number, series, type, address, edition, month, note],
  'incollection': [editor, [volume, number], series, type, chapter, pages, address, edition, month, note],
  'manual': [author, organization, year, address, edition, month, note],
  'mastersthesis': [type, address, month, note],
  'misc': [],
  'phdthesis': [type, address, month, note],
  'proceedings': [editor, [volume, number], series, address, month, organization, publisher, note],
  'techreport': [type, address, number, month, note],
  'unpublished': [month, year]
};
const mandatoryFields = {
  'article': [author, title, year, journal],
  'book': [[author, editor], title, publisher, year],
  'booklet': [title],
  'conference': [author, title, booktitle, year],
  'inproceedings': [author, title, booktitle, year],
  'inbook': [[author, editor], title, [chapter, pages]],
  'incollection': [author, title, booktitle, publisher, year],
  'manual': [title],
  'mastersthesis': [author, title, school, year],
  'misc': [[author, title, howpublished, year, month, note]],
  'phdthesis': [author, title, school, year],
  'proceedings': [year, title],
  'techreport': [author, title, institution, year],
  'unpublished': [author, title, note]
};

export function checkMandatoryFields(id, type, fields) {
  const mandatoryFields = optionalFields[type] || [];
  //const optionalFields = optionalFields[type] || [];

  mandatoryFields.forEach(field => {
    if (typeof field == 'string') {
      if (!fields[field]) console.warn("Warning: expected " + type + " with id " + id
        + " to have the field: " + field);
    } else if (!field.reduce((fieldName, acc) => acc && fields[fieldName])) {
      // not one of a list of options
      console.warn("Expected " + type + " with id " + id
        + " to have one of the following fields: " + field);
    }
  });
}

/**
 * @param str Bibliography file that should conform to BibTex standard
 * @return Bibliography the parsed bibliography
 */
export function parseString(str) {
  // Tokenize string
  let tokens = [];
  const lexer = new Lexer(str);
  let nextToken;
  while (nextToken = lexer.readNextToken()) tokens.push(nextToken);

  // Parse tokens
  const parser = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
  parser.feed(tokens);
  const result = parser.results;

  if (result.length <= 0) throw new Error("Found 0 parses for input string.");
  else if (result.length > 1) console.warn("Found multiple parses for input string. This is a bug. Please report this issue to https://github.com/digitalheir/bibliography-js/issues");
  return new Bibliography(result[0]);
}
