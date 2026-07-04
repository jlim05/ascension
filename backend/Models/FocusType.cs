namespace Ascension.Api.Models;

public static class FocusType
{
    public const string Bulking = "Bulking";
    public const string Cutting = "Cutting";
    public const string Maintain = "Maintain";
    public const string MainGain = "MainGain";

    public static readonly string[] All = 
        { Bulking, Cutting, Maintain, MainGain };

    public static bool IsValid(string focus) =>
        All.Contains(focus);
}