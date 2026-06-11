namespace MalakaBooks.General
{
  public class PagingParam
  {
    public string? Input { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 25;
  }
}
